import { Injectable, NotFoundException } from '@nestjs/common';
import { RecurringPlanStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateRecurringPlanDto } from '../dto/create-recurring-plan.dto';
import { UpdateRecurringPlanDto } from '../dto/update-recurring-plan.dto';
import { RecurringPlanEntity } from '../entities/recurring-plan.entity';
import { RecurringPlanCreationService } from './recurring-plan-creation.service';
import { RecurringPlanExecutionService } from './recurring-plan-execution.service';
import { RecurringPlanProgressService } from './recurring-plan-progress.service';
import { RecurringPlanValidationService } from './recurring-plan-validation.service';
import { RecurringPlanSchedulingService } from './recurring-plan-scheduling.service';

/**
 * Recurring Plans Service (Main Orchestrator)
 *
 * Coordinates all recurring plan operations by delegating to specialized services
 * Single Responsibility: Orchestration and high-level queries
 */
@Injectable()
export class RecurringPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creationService: RecurringPlanCreationService,
    private readonly executionService: RecurringPlanExecutionService,
    private readonly progressService: RecurringPlanProgressService,
    private readonly validationService: RecurringPlanValidationService,
    private readonly schedulingService: RecurringPlanSchedulingService,
  ) {}

  // ==================== Plan Management ====================

  /**
   * Create a new recurring savings plan
   */
  async createPlan(dto: CreateRecurringPlanDto) {
    return this.creationService.createPlan(dto);
  }

  /**
   * Get a plan by ID with details
   */
  async getPlanById(planId: string) {
    const plan = await this.prisma.recurringSavingsPlan.findUnique({
      where: { id: planId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${planId} not found`);
    }

    return plan;
  }

  /**
   * Get all plans for a user
   */
  async getUserPlans(userId: string) {
    const plans = await this.prisma.recurringSavingsPlan.findMany({
      where: { userId },
      include: {
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map(RecurringPlanEntity.fromModel);
  }

  /**
   * Update a plan
   */
  async updatePlan(planId: string, dto: UpdateRecurringPlanDto) {
    const plan = await this.prisma.recurringSavingsPlan.update({
      where: { id: planId },
      data: {
        name: dto.name,
        goalName: dto.goalName,
        goalAmountAED: dto.goalAmountAED,
        goalDate: dto.goalDate ? new Date(dto.goalDate) : undefined,
        recurringAmountAED: dto.recurringAmountAED,
        frequency: dto.frequency,
        executionDay: dto.executionDay,
        cardToken: dto.cardToken,
        status: dto.status,
        metadata: dto.metadata as any,
      },
    });

    // Recalculate next execution date if frequency or executionDay changed
    if (dto.frequency || dto.executionDay) {
      const nextDate = this.schedulingService.calculateNextExecutionDate(
        new Date(),
        plan.frequency,
        plan.executionDay
      );

      await this.prisma.recurringSavingsPlan.update({
        where: { id: planId },
        data: { nextExecutionDate: nextDate },
      });
    }

    return RecurringPlanEntity.fromModel(plan);
  }

  /**
   * Pause a plan
   */
  async pausePlan(planId: string) {
    const plan = await this.prisma.recurringSavingsPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${planId} not found`);
    }

    this.validationService.validateCanPause(plan.status);

    return this.updatePlan(planId, { status: RecurringPlanStatus.PAUSED });
  }

  /**
   * Resume a paused plan
   */
  async resumePlan(planId: string) {
    const plan = await this.prisma.recurringSavingsPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${planId} not found`);
    }

    this.validationService.validateCanResume(plan.status);

    // Recalculate next execution date
    const nextDate = this.schedulingService.calculateNextExecutionDate(
      new Date(),
      plan.frequency,
      plan.executionDay
    );

    await this.prisma.recurringSavingsPlan.update({
      where: { id: planId },
      data: {
        status: RecurringPlanStatus.ACTIVE,
        nextExecutionDate: nextDate,
      },
    });

    return this.getPlanById(planId);
  }

  /**
   * Cancel a plan
   */
  async cancelPlan(planId: string) {
    const updated = await this.prisma.recurringSavingsPlan.update({
      where: { id: planId },
      data: { status: RecurringPlanStatus.CANCELLED },
    });

    return RecurringPlanEntity.fromModel(updated);
  }

  // ==================== Executions ====================

  /**
   * Get execution history for a plan
   */
  async getPlanExecutions(planId: string) {
    return this.executionService.getPlanExecutions(planId);
  }

  /**
   * Manually execute a plan (admin/testing)
   */
  async executePlanManually(planId: string) {
    return this.executionService.executePlan(planId);
  }

  // ==================== Progress Tracking ====================

  /**
   * Get progress towards goal
   */
  async getPlanProgress(planId: string) {
    return this.progressService.calculateProgress(planId);
  }

  /**
   * Find plans that are due for execution
   */
  async findDuePlans() {
    const plans = await this.prisma.recurringSavingsPlan.findMany({
      where: {
        status: RecurringPlanStatus.ACTIVE,
        nextExecutionDate: {
          lte: new Date(),
        },
      },
    });

    return plans.map(RecurringPlanEntity.fromModel);
  }
}
