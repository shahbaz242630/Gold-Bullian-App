import { Nominee } from '@prisma/client';
import { Expose } from 'class-transformer';

export class NomineeEntity {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  fullName!: string;

  @Expose()
  relationship!: string;

  @Expose()
  email?: string | null;

  @Expose()
  phoneNumber?: string | null;

  @Expose()
  countryCode?: string | null;

  @Expose()
  documents?: Record<string, unknown> | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  static fromModel(model: Nominee): NomineeEntity {
    const entity = new NomineeEntity();
    entity.id = model.id;
    entity.userId = model.userId;
    entity.fullName = model.fullName;
    entity.relationship = model.relationship;
    entity.email = model.email ?? null;
    entity.phoneNumber = model.phoneNumber ?? null;
    entity.countryCode = model.countryCode ?? null;
    entity.documents = (model.documents as Record<string, unknown>) ?? null;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}

