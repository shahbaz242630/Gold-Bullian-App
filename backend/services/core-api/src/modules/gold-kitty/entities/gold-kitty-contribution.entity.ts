import { GoldKittyContribution } from '@prisma/client';

export class GoldKittyContributionEntity {
  id: string;
  kittyId: string;
  memberId: string;
  roundNumber: number;
  amountAED: number;
  goldGrams: number;
  transactionId: string | null;
  contributedAt: Date | null;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromModel(model: GoldKittyContribution): GoldKittyContributionEntity {
    const entity = new GoldKittyContributionEntity();
    entity.id = model.id;
    entity.kittyId = model.kittyId;
    entity.memberId = model.memberId;
    entity.roundNumber = model.roundNumber;
    entity.amountAED = Number(model.amountAED);
    entity.goldGrams = Number(model.goldGrams);
    entity.transactionId = model.transactionId;
    entity.contributedAt = model.contributedAt;
    entity.isPaid = model.isPaid;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}
