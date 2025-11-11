import { RecurringSavingsPlan, RecurringPlanStatus, RecurringPlanFrequency } from '@prisma/client';

export class RecurringPlanEntity {
  id!: string;
  userId!: string;
  name!: string;
  goalName!: string | null;
  goalAmountAED!: number | null;
  goalDate!: Date | null;
  recurringAmountAED!: number;
  frequency!: RecurringPlanFrequency;
  executionDay!: number;
  startDate!: Date;
  endDate!: Date | null;
  status!: RecurringPlanStatus;
  nextExecutionDate!: Date | null;
  cardToken!: string | null;
  metadata!: any;
  createdAt!: Date;
  updatedAt!: Date;

  static fromModel(model: RecurringSavingsPlan): RecurringPlanEntity {
    const entity = new RecurringPlanEntity();
    entity.id = model.id;
    entity.userId = model.userId;
    entity.name = model.name;
    entity.goalName = model.goalName;
    entity.goalAmountAED = model.goalAmountAED ? Number(model.goalAmountAED) : null;
    entity.goalDate = model.goalDate;
    entity.recurringAmountAED = Number(model.recurringAmountAED);
    entity.frequency = model.frequency;
    entity.executionDay = model.executionDay;
    entity.startDate = model.startDate;
    entity.endDate = model.endDate;
    entity.status = model.status;
    entity.nextExecutionDate = model.nextExecutionDate;
    entity.cardToken = model.cardToken;
    entity.metadata = model.metadata;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}
