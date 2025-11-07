import { GoldKittyAllocation } from '@prisma/client';

export class GoldKittyAllocationEntity {
  id: string;
  kittyId: string;
  memberId: string;
  roundNumber: number;
  totalGoldGrams: number;
  totalAmountAED: number;
  allocatedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  static fromModel(model: GoldKittyAllocation): GoldKittyAllocationEntity {
    const entity = new GoldKittyAllocationEntity();
    entity.id = model.id;
    entity.kittyId = model.kittyId;
    entity.memberId = model.memberId;
    entity.roundNumber = model.roundNumber;
    entity.totalGoldGrams = Number(model.totalGoldGrams);
    entity.totalAmountAED = Number(model.totalAmountAED);
    entity.allocatedAt = model.allocatedAt;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}
