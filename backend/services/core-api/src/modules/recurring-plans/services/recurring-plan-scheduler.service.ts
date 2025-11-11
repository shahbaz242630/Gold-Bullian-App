import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringPlansService } from './recurring-plans.service';
import { RecurringPlanExecutionService } from './recurring-plan-execution.service';

/**
 * Recurring Plan Scheduler Service
 *
 * Handles automated execution of recurring plans via cron jobs
 * Single Responsibility: Scheduled task execution
 *
 * SETUP REQUIRED:
 * 1. Install @nestjs/schedule: npm install @nestjs/schedule
 * 2. Import ScheduleModule in RecurringPlansModule:
 *    import { ScheduleModule } from '@nestjs/schedule';
 *    imports: [ScheduleModule.forRoot(), ...]
 * 3. Uncomment the @Cron decorators below
 * 4. Add environment variable: RECURRING_PLANS_ENABLED=true
 */
@Injectable()
export class RecurringPlanSchedulerService {
  private readonly logger = new Logger(RecurringPlanSchedulerService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly recurringPlansService: RecurringPlansService,
    private readonly executionService: RecurringPlanExecutionService,
  ) {
    this.enabled = process.env.RECURRING_PLANS_ENABLED === 'true';

    if (!this.enabled) {
      this.logger.warn(
        'Recurring plan scheduler is DISABLED. Set RECURRING_PLANS_ENABLED=true to enable.'
      );
    }
  }

  /**
   * Check for due plans every day at midnight
   * Uncomment @Cron decorator when @nestjs/schedule is installed
   */
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkDuePlans(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    this.logger.log('Checking for plans due for execution...');

    try {
      // Find all plans that are due
      const duePlans = await this.recurringPlansService.findDuePlans();

      this.logger.log(`Found ${duePlans.length} plans due for execution`);

      // Execute each plan
      for (const plan of duePlans) {
        try {
          this.logger.log(`Executing plan ${plan.id} (${plan.name})...`);
          await this.executionService.executePlan(plan.id);
          this.logger.log(`Successfully executed plan ${plan.id}`);
        } catch (error) {
          const err = error as Error;
          this.logger.error(
            `Failed to execute plan ${plan.id}: ${err.message}`,
            err.stack
          );
          // Continue with next plan
        }
      }

      this.logger.log('Finished checking due plans');
    } catch (error) {
      this.logger.error('Error checking due plans:', error);
    }
  }

  /**
   * Retry failed executions every day at 2 AM
   * Uncomment @Cron decorator when @nestjs/schedule is installed
   */
  // @Cron('0 2 * * *')
  async retryFailedExecutions(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    this.logger.log('Retrying failed executions...');

    try {
      // Find failed executions from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const failedExecutions = await this.findRecentFailedExecutions(sevenDaysAgo);

      this.logger.log(`Found ${failedExecutions.length} failed executions to retry`);

      for (const execution of failedExecutions) {
        try {
          this.logger.log(`Retrying execution ${execution.id}...`);
          await this.executionService.retryExecution(execution.id);
          this.logger.log(`Successfully retried execution ${execution.id}`);
        } catch (error) {
          const err = error as Error;
          this.logger.error(
            `Failed to retry execution ${execution.id}: ${err.message}`
          );
          // Continue with next execution
        }
      }

      this.logger.log('Finished retrying failed executions');
    } catch (error) {
      this.logger.error('Error retrying failed executions:', error);
    }
  }

  /**
   * Helper method to find recent failed executions
   */
  private async findRecentFailedExecutions(since: Date): Promise<Array<{ id: string }>> {
    // This would use Prisma to find failed executions
    // Implementation depends on your specific requirements
    return [];
  }

  /**
   * Manual trigger for testing (call this endpoint from admin panel)
   */
  async manualTrigger(): Promise<{ executed: number; failed: number }> {
    const duePlans = await this.recurringPlansService.findDuePlans();

    let executed = 0;
    let failed = 0;

    for (const plan of duePlans) {
      try {
        await this.executionService.executePlan(plan.id);
        executed++;
      } catch (error) {
        failed++;
      }
    }

    return { executed, failed };
  }
}
