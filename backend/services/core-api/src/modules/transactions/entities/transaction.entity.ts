import { Transaction, TransactionStatus, TransactionType } from '@prisma/client';
import { Expose } from 'class-transformer';

export class TransactionEntity {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  walletId!: string;

  @Expose()
  type!: TransactionType;

  @Expose()
  status!: TransactionStatus;

  @Expose()
  goldGrams!: string;

  @Expose()
  fiatAmount!: string;

  @Expose()
  fiatCurrency!: string;

  @Expose()
  feeAmount!: string;

  @Expose()
  feeCurrency!: string;

  @Expose()
  referenceCode!: string;

  @Expose()
  metadata?: Record<string, unknown> | null;

  @Expose()
  completedAt?: Date | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  static fromModel(model: Transaction): TransactionEntity {
    const entity = new TransactionEntity();
    entity.id = model.id;
    entity.userId = model.userId;
    entity.walletId = model.walletId;
    entity.type = model.type;
    entity.status = model.status;
    entity.goldGrams = model.goldGrams.toString();
    entity.fiatAmount = model.fiatAmount.toString();
    entity.fiatCurrency = model.fiatCurrency;
    entity.feeAmount = model.feeAmount.toString();
    entity.feeCurrency = model.feeCurrency;
    entity.referenceCode = model.referenceCode;
    entity.metadata = (model.metadata as Record<string, unknown>) ?? null;
    entity.completedAt = model.completedAt;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}

