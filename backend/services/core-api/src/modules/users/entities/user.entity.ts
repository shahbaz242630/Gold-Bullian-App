import { KycStatus, OnboardingStep, User } from '@prisma/client';
import { Expose } from 'class-transformer';

export class UserEntity {
  @Expose()
  id!: string;

  @Expose()
  supabaseUid!: string;

  @Expose()
  email?: string | null;

  @Expose()
  phoneNumber?: string | null;

  @Expose()
  firstName?: string | null;

  @Expose()
  lastName?: string | null;

  @Expose()
  countryCode?: string | null;

  @Expose()
  kycStatus!: KycStatus;

  @Expose()
  onboardingStep!: OnboardingStep;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  static fromModel(model: User): UserEntity {
    const entity = new UserEntity();
    entity.id = model.id;
    entity.supabaseUid = model.supabaseUid;
    entity.email = model.email;
    entity.phoneNumber = model.phoneNumber;
    entity.firstName = model.firstName;
    entity.lastName = model.lastName;
    entity.countryCode = model.countryCode;
    entity.kycStatus = model.kycStatus;
    entity.onboardingStep = model.onboardingStep;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}

