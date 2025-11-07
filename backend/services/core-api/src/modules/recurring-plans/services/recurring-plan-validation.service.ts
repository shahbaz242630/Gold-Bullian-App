import { Injectable, BadRequestException } from '@nestjs/common';
import { RecurringPlanFrequency } from '@prisma/client';

/**
 * Recurring Plan Validation Service
 *
 * Handles all business rule validations for Recurring Plans
 * Single Responsibility: Validate plan operations
 */
@Injectable()
export class RecurringPlanValidationService {
  /**
   * Validate plan creation
   */
  validatePlanCreation(
    recurringAmountAED: number,
    frequency: RecurringPlanFrequency,
    executionDay: number,
    goalAmountAED?: number
  ): void {
    // Validate minimum amount
    if (recurringAmountAED < 10) {
      throw new BadRequestException('Recurring amount must be at least 10 AED');
    }

    // Validate execution day based on frequency
    if (frequency === RecurringPlanFrequency.MONTHLY) {
      if (executionDay < 1 || executionDay > 31) {
        throw new BadRequestException('Execution day for monthly plan must be between 1-31');
      }
    } else if (frequency === RecurringPlanFrequency.WEEKLY) {
      if (executionDay < 1 || executionDay > 7) {
        throw new BadRequestException('Execution day for weekly plan must be between 1-7 (1=Monday, 7=Sunday)');
      }
    }

    // Validate goal amount if provided
    if (goalAmountAED !== undefined && goalAmountAED <= recurringAmountAED) {
      throw new BadRequestException('Goal amount must be greater than recurring amount');
    }
  }

  /**
   * Validate card token is provided for auto-debit
   */
  validateCardToken(cardToken?: string): void {
    if (!cardToken) {
      throw new BadRequestException(
        'Card token required for recurring plans with auto-debit'
      );
    }
  }

  /**
   * Validate plan can be paused
   */
  validateCanPause(status: string): boolean {
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      throw new BadRequestException(`Cannot pause a ${status.toLowerCase()} plan`);
    }
    return true;
  }

  /**
   * Validate plan can be resumed
   */
  validateCanResume(status: string): boolean {
    if (status !== 'PAUSED') {
      throw new BadRequestException('Can only resume paused plans');
    }
    return true;
  }
}
