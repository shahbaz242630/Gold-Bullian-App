import { User, KycStatus } from '@prisma/client';

/**
 * Kid Account Entity
 * Represents a child account linked to a parent
 */
export class KidAccountEntity {
  id!: string;
  supabaseUid!: string;
  email!: string | null;
  phoneNumber!: string | null;
  firstName!: string | null;
  lastName!: string | null;
  countryCode!: string | null;
  dateOfBirth!: Date | null;
  kycStatus!: KycStatus;
  parentUserId!: string | null;
  isKidsAccount!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  // Extended properties for UI
  fullName?: string;
  age?: number;

  static fromModel(model: User): KidAccountEntity {
    const entity = new KidAccountEntity();
    entity.id = model.id;
    entity.supabaseUid = model.supabaseUid;
    entity.email = model.email;
    entity.phoneNumber = model.phoneNumber;
    entity.firstName = model.firstName;
    entity.lastName = model.lastName;
    entity.countryCode = model.countryCode;
    entity.dateOfBirth = model.dateOfBirth;
    entity.kycStatus = model.kycStatus;
    entity.parentUserId = model.parentUserId;
    entity.isKidsAccount = model.isKidsAccount;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;

    // Computed properties
    if (model.firstName && model.lastName) {
      entity.fullName = `${model.firstName} ${model.lastName}`;
    }

    if (model.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(model.dateOfBirth);
      entity.age = today.getFullYear() - birthDate.getFullYear();
    }

    return entity;
  }
}
