import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateRecurringPlanDto } from '../dto/create-recurring-plan.dto';
import { RecurringPlanEntity } from '../entities/recurring-plan.entity';
import { RecurringPlanValidationService } from './recurring-plan-validation.service';
import { RecurringPlanSchedulingService } from './recurring-plan-scheduling.service';

/**
 * Recurring Plan Creation Service
 *
 * Handles creating new recurring savings plans
 * Single Responsibility: Plan creation and initialization
 */
@Injectable()
export class RecurringPlanCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: RecurringPlanValidationService,
    private readonly schedulingService: RecurringPlanSchedulingService,
  ) {}

  /**
   * Create a new recurring savings plan
   */
  async createPlan(dto: CreateRecurringPlanDto): Promise<RecurringPlanEntity> {
    // Validate business rules
    this.validationService.validatePlanCreation(
      dto.recurringAmountAED,
      dto.frequency,
      dto.executionDay,
      dto.goalAmountAED
    );

    // Calculate first execution date
    const startDate = new Date(dto.startDate);
    const firstExecutionDate = this.schedulingService.calculateFirstExecutionDate(
      startDate,
      dto.frequency,
      dto.executionDay
    );

    // Create the plan
    const plan = await this.prisma.recurringSavingsPlan.create({
      data: {
        userId: dto.userId,
        name: dto.name,
        goalName: dto.goalName,
        goalAmountAED: dto.goalAmountAED
          ? new Prisma.Decimal(dto.goalAmountAED)
          : null,
        goalDate: dto.goalDate ? new Date(dto.goalDate) : null,
        recurringAmountAED: new Prisma.Decimal(dto.recurringAmountAED),
        frequency: dto.frequency,
        executionDay: dto.executionDay,
        startDate,
        nextExecutionDate: firstExecutionDate,
        cardToken: dto.cardToken,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });

    return RecurringPlanEntity.fromModel(plan);
  }
}
