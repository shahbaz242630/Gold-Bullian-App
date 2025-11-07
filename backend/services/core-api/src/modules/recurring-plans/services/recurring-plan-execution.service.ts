import { Injectable, Logger } from '@nestjs/common';
import { Prisma, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { RecurringPlanExecutionEntity } from '../entities/recurring-plan-execution.entity';
import { RecurringPlanSchedulingService } from './recurring-plan-scheduling.service';

/**
 * Recurring Plan Execution Service
 *
 * Handles executing scheduled purchases (auto-debit + gold purchase)
 * Single Responsibility: Execute plan payments
 */
@Injectable()
export class RecurringPlanExecutionService {
  private readonly logger = new Logger(RecurringPlanExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulingService: RecurringPlanSchedulingService,
  ) {}

  /**
   * Execute a plan (process payment and purchase gold)
   * This is called by the cron scheduler
   */
  async executePlan(planId: string): Promise<RecurringPlanExecutionEntity> {
    const plan = await this.prisma.recurringSavingsPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.status !== 'ACTIVE') {
      throw new Error(`Plan ${planId} is not active`);
    }

    const scheduledDate = plan.nextExecutionDate || new Date();

    try {
      // Create execution record
      const execution = await this.prisma.recurringPlanExecution.create({
        data: {
          planId,
          scheduledDate,
          amountAED: plan.recurringAmountAED,
          status: TransactionStatus.PENDING,
        },
      });

      // TODO: Integrate with PaymentService to charge card
      // const paymentResult = await this.paymentService.processRecurringPayment(
      //   plan.userId,
      //   plan.cardToken,
      //   Number(plan.recurringAmountAED),
      //   `Recurring Plan: ${plan.name}`
      // );

      // TODO: If payment successful, purchase gold
      // const goldPurchase = await this.buyGoldService.buyGold({
      //   userId: plan.userId,
      //   amountAED: Number(plan.recurringAmountAED),
      // });

      // For now, simulate successful execution
      const goldGrams = Number(plan.recurringAmountAED) / 200; // Mock conversion

      const updatedExecution = await this.prisma.recurringPlanExecution.update({
        where: { id: execution.id },
        data: {
          executedDate: new Date(),
          goldGrams: new Prisma.Decimal(goldGrams),
          status: TransactionStatus.COMPLETED,
        },
      });

      // Calculate next execution date
      const nextDate = this.schedulingService.calculateNextExecutionDate(
        new Date(),
        plan.frequency,
        plan.executionDay
      );

      // Update plan's next execution date
      await this.prisma.recurringSavingsPlan.update({
        where: { id: planId },
        data: { nextExecutionDate: nextDate },
      });

      this.logger.log(
        `Executed plan ${planId}: ${goldGrams}g gold purchased. Next execution: ${nextDate}`
      );

      return RecurringPlanExecutionEntity.fromModel(updatedExecution);
    } catch (error) {
      // Handle execution failure
      this.logger.error(`Failed to execute plan ${planId}:`, error);

      await this.prisma.recurringPlanExecution.updateMany({
        where: { planId, scheduledDate },
        data: {
          status: TransactionStatus.FAILED,
          failureReason: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Retry a failed execution
   */
  async retryExecution(executionId: string): Promise<RecurringPlanExecutionEntity> {
    const execution = await this.prisma.recurringPlanExecution.findUnique({
      where: { id: executionId },
      include: { plan: true },
    });

    if (!execution || execution.status !== TransactionStatus.FAILED) {
      throw new Error('Can only retry failed executions');
    }

    // Retry by executing the plan again
    return this.executePlan(execution.planId);
  }

  /**
   * Get execution history for a plan
   */
  async getPlanExecutions(planId: string): Promise<RecurringPlanExecutionEntity[]> {
    const executions = await this.prisma.recurringPlanExecution.findMany({
      where: { planId },
      orderBy: { scheduledDate: 'desc' },
    });

    return executions.map(RecurringPlanExecutionEntity.fromModel);
  }
}
