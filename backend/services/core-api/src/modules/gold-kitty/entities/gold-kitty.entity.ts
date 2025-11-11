import { GoldKitty, GoldKittyStatus } from '@prisma/client';

export class GoldKittyEntity {
  id!: string;
  ownerId!: string;
  name!: string;
  description!: string | null;
  monthlyAmountAED!: number;
  contributionDay!: number;
  startDate!: Date;
  endDate!: Date | null;
  status!: GoldKittyStatus;
  currentRound!: number;
  totalRounds!: number;
  metadata!: any;
  createdAt!: Date;
  updatedAt!: Date;

  static fromModel(model: GoldKitty): GoldKittyEntity {
    const entity = new GoldKittyEntity();
    entity.id = model.id;
    entity.ownerId = model.ownerId;
    entity.name = model.name;
    entity.description = model.description;
    entity.monthlyAmountAED = Number(model.monthlyAmountAED);
    entity.contributionDay = model.contributionDay;
    entity.startDate = model.startDate;
    entity.endDate = model.endDate;
    entity.status = model.status;
    entity.currentRound = model.currentRound;
    entity.totalRounds = model.totalRounds;
    entity.metadata = model.metadata;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}
