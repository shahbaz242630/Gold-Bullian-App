import { KycProfile, KycStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class KycProfileEntity {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  provider!: string;

  @Expose()
  providerRef?: string | null;

  @Expose()
  status!: KycStatus;

  @Expose()
  submittedAt?: Date | null;

  @Expose()
  reviewedAt?: Date | null;

  @Expose()
  reviewerId?: string | null;

  @Expose()
  notes?: string | null;

  @Expose()
  metadata?: Record<string, unknown> | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  static fromModel(model: KycProfile): KycProfileEntity {
    const entity = new KycProfileEntity();
    entity.id = model.id;
    entity.userId = model.userId;
    entity.provider = model.provider;
    entity.providerRef = model.providerRef;
    entity.status = model.status;
    entity.submittedAt = model.submittedAt;
    entity.reviewedAt = model.reviewedAt;
    entity.reviewerId = model.reviewerId;
    entity.notes = model.notes ?? null;
    entity.metadata = (model.metadata as Record<string, unknown>) ?? null;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}

