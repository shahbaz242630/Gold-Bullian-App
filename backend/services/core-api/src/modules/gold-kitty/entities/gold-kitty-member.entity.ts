import { GoldKittyMember } from '@prisma/client';

export class GoldKittyMemberEntity {
  id!: string;
  kittyId!: string;
  userId!: string;
  joinedAt!: Date;
  isActive!: boolean;
  allocationOrder!: number;
  hasReceivedPot!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromModel(model: GoldKittyMember): GoldKittyMemberEntity {
    const entity = new GoldKittyMemberEntity();
    entity.id = model.id;
    entity.kittyId = model.kittyId;
    entity.userId = model.userId;
    entity.joinedAt = model.joinedAt;
    entity.isActive = model.isActive;
    entity.allocationOrder = model.allocationOrder;
    entity.hasReceivedPot = model.hasReceivedPot;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}
