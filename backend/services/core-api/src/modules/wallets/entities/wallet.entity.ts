import { Wallet, WalletType } from '@prisma/client';
import { Expose } from 'class-transformer';

export class WalletEntity {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  type!: WalletType;

  @Expose()
  balanceGrams!: string;

  @Expose()
  lockedGrams!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  static fromModel(model: Wallet): WalletEntity {
    const entity = new WalletEntity();
    entity.id = model.id;
    entity.userId = model.userId;
    entity.type = model.type;
    entity.balanceGrams = model.balanceGrams.toString();
    entity.lockedGrams = model.lockedGrams.toString();
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}

