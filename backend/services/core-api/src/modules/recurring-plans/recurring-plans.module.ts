import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users/users.module';
import { RecurringPlansController } from './recurring-plans.controller';
import { RecurringPlansService } from './services/recurring-plans.service';
import { RecurringPlanCreationService } from './services/recurring-plan-creation.service';
import { RecurringPlanExecutionService } from './services/recurring-plan-execution.service';
import { RecurringPlanProgressService } from './services/recurring-plan-progress.service';
import { RecurringPlanValidationService } from './services/recurring-plan-validation.service';
import { RecurringPlanSchedulingService } from './services/recurring-plan-scheduling.service';
import { RecurringPlanSchedulerService } from './services/recurring-plan-scheduler.service';

/**
 * Recurring Plans Module
 *
 * Enterprise-level modular architecture for Recurring Savings Plans
 *
 * Features:
 * - Goal-based automated gold savings
 * - Flexible frequency (daily, weekly, monthly, yearly)
 * - Auto-debit from linked card
 * - Progress tracking towards goals
 * - Scheduled execution via cron jobs
 * - Full execution history and retry logic
 *
 * Architecture:
 * - Specialized services with single responsibilities
 * - Clean separation of concerns
 * - Easy to test and debug
 * - Scalable and maintainable
 *
 * Security:
 * - Ownership verification on all endpoints
 * - Admin-only access to scheduler trigger
 *
 * Setup for Cron Jobs:
 * 1. Install: npm install @nestjs/schedule
 * 2. Import ScheduleModule.forRoot() in this module
 * 3. Uncomment @Cron decorators in RecurringPlanSchedulerService
 * 4. Set environment variable: RECURRING_PLANS_ENABLED=true
 */
@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    // TODO: Add when @nestjs/schedule is installed
    // ScheduleModule.forRoot(),
  ],
  controllers: [RecurringPlansController],
  providers: [
    // Main orchestrator
    RecurringPlansService,

    // Specialized services
    RecurringPlanCreationService,
    RecurringPlanExecutionService,
    RecurringPlanProgressService,
    RecurringPlanValidationService,
    RecurringPlanSchedulingService,
    RecurringPlanSchedulerService,
  ],
  exports: [RecurringPlansService],
})
export class RecurringPlansModule {}
