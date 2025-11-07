import { Injectable } from '@nestjs/common';
import { RecurringPlanFrequency } from '@prisma/client';

/**
 * Recurring Plan Scheduling Service
 *
 * Handles date calculations for recurring executions
 * Single Responsibility: Schedule calculations
 */
@Injectable()
export class RecurringPlanSchedulingService {
  /**
   * Calculate the next execution date based on frequency
   */
  calculateNextExecutionDate(
    currentDate: Date,
    frequency: RecurringPlanFrequency,
    executionDay: number
  ): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case RecurringPlanFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;

      case RecurringPlanFrequency.WEEKLY:
        // executionDay: 1=Monday, 7=Sunday
        const currentDayOfWeek = nextDate.getDay() === 0 ? 7 : nextDate.getDay();
        const daysUntilExecution = (executionDay - currentDayOfWeek + 7) % 7;
        nextDate.setDate(nextDate.getDate() + (daysUntilExecution || 7));
        break;

      case RecurringPlanFrequency.MONTHLY:
        // executionDay: 1-31
        nextDate.setMonth(nextDate.getMonth() + 1);
        const daysInNextMonth = this.getDaysInMonth(nextDate);
        nextDate.setDate(Math.min(executionDay, daysInNextMonth));
        break;

      case RecurringPlanFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  /**
   * Calculate first execution date from start date
   */
  calculateFirstExecutionDate(
    startDate: Date,
    frequency: RecurringPlanFrequency,
    executionDay: number
  ): Date {
    const firstExecution = new Date(startDate);

    if (frequency === RecurringPlanFrequency.DAILY) {
      // Start immediately or next day
      return firstExecution;
    }

    if (frequency === RecurringPlanFrequency.WEEKLY) {
      // Find next occurrence of executionDay
      const currentDayOfWeek = firstExecution.getDay() === 0 ? 7 : firstExecution.getDay();
      const daysUntilExecution = (executionDay - currentDayOfWeek + 7) % 7;
      firstExecution.setDate(firstExecution.getDate() + daysUntilExecution);
      return firstExecution;
    }

    if (frequency === RecurringPlanFrequency.MONTHLY) {
      // Set to executionDay of current or next month
      const daysInMonth = this.getDaysInMonth(firstExecution);
      const adjustedDay = Math.min(executionDay, daysInMonth);

      if (firstExecution.getDate() <= adjustedDay) {
        firstExecution.setDate(adjustedDay);
      } else {
        // Move to next month
        firstExecution.setMonth(firstExecution.getMonth() + 1);
        const daysInNextMonth = this.getDaysInMonth(firstExecution);
        firstExecution.setDate(Math.min(executionDay, daysInNextMonth));
      }
      return firstExecution;
    }

    // YEARLY
    return firstExecution;
  }

  /**
   * Check if plan should execute today
   */
  shouldExecuteToday(nextExecutionDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const executionDate = new Date(nextExecutionDate);
    executionDate.setHours(0, 0, 0, 0);

    return executionDate <= today;
  }

  /**
   * Get number of days in a month
   */
  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }
}
