import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TransactionStatus } from '@prisma/client';

/**
 * Recurring Plan Progress Service
 *
 * Handles goal progress tracking and statistics
 * Single Responsibility: Progress calculations
 */
@Injectable()
export class RecurringPlanProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate progress towards goal
   */
  async calculateProgress(planId: string): Promise<{
    totalInvestedAED: number;
    totalGoldGrams: number;
    goalAmountAED: number | null;
    goalDate: Date | null;
    progressPercentage: number;
    executionsCompleted: number;
    executionsFailed: number;
    estimatedCompletionDate: Date | null;
  }> {
    const plan = await this.prisma.recurringSavingsPlan.findUnique({
      where: { id: planId },
      include: {
        executions: {
          where: { status: TransactionStatus.COMPLETED },
        },
      },
    });

    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    // Calculate total invested
    const totalInvestedAED = plan.executions.reduce(
      (sum, exec) => sum + Number(exec.amountAED),
      0
    );

    // Calculate total gold accumulated
    const totalGoldGrams = plan.executions.reduce(
      (sum, exec) => sum + Number(exec.goldGrams || 0),
      0
    );

    // Count executions
    const executionsCompleted = plan.executions.length;
    const executionsFailed = await this.prisma.recurringPlanExecution.count({
      where: { planId, status: TransactionStatus.FAILED },
    });

    // Calculate progress percentage
    let progressPercentage = 0;
    if (plan.goalAmountAED) {
      progressPercentage = Math.min(
        (totalInvestedAED / Number(plan.goalAmountAED)) * 100,
        100
      );
    }

    // Estimate completion date
    let estimatedCompletionDate: Date | null = null;
    if (plan.goalAmountAED && executionsCompleted > 0) {
      const remaining = Number(plan.goalAmountAED) - totalInvestedAED;
      const monthlyAmount = Number(plan.recurringAmountAED);

      if (remaining > 0) {
        const estimatedMonths = Math.ceil(remaining / monthlyAmount);
        estimatedCompletionDate = new Date();
        estimatedCompletionDate.setMonth(
          estimatedCompletionDate.getMonth() + estimatedMonths
        );
      }
    }

    return {
      totalInvestedAED,
      totalGoldGrams,
      goalAmountAED: plan.goalAmountAED ? Number(plan.goalAmountAED) : null,
      goalDate: plan.goalDate,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      executionsCompleted,
      executionsFailed,
      estimatedCompletionDate,
    };
  }

  /**
   * Check if goal has been reached
   */
  async hasReachedGoal(planId: string): Promise<boolean> {
    const progress = await this.calculateProgress(planId);

    if (!progress.goalAmountAED) {
      return false; // No goal set
    }

    return progress.totalInvestedAED >= progress.goalAmountAED;
  }
}
