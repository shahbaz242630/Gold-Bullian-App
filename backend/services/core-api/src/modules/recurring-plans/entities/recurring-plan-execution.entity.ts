import { RecurringPlanExecution, TransactionStatus } from '@prisma/client';

export class RecurringPlanExecutionEntity {
  id!: string;
  planId!: string;
  scheduledDate!: Date;
  executedDate!: Date | null;
  amountAED!: number;
  goldGrams!: number | null;
  transactionId!: string | null;
  status!: TransactionStatus;
  failureReason!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromModel(model: RecurringPlanExecution): RecurringPlanExecutionEntity {
    const entity = new RecurringPlanExecutionEntity();
    entity.id = model.id;
    entity.planId = model.planId;
    entity.scheduledDate = model.scheduledDate;
    entity.executedDate = model.executedDate;
    entity.amountAED = Number(model.amountAED);
    entity.goldGrams = model.goldGrams ? Number(model.goldGrams) : null;
    entity.transactionId = model.transactionId;
    entity.status = model.status;
    entity.failureReason = model.failureReason;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}
