import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WalletType } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { WalletEntity } from './entities/wallet.entity';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndType(userId: string, type: WalletType): Promise<WalletEntity> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId_type: { userId, type } },
    });

    if (!wallet) {
      throw new NotFoundException(Wallet  not found for user );
    }

    return WalletEntity.fromModel(wallet);
  }

  async ensureWallet(userId: string, type: WalletType = WalletType.GOLD) {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId_type: { userId, type } },
      update: {},
      create: {
        userId,
        type,
        balanceGrams: new Prisma.Decimal(0),
        lockedGrams: new Prisma.Decimal(0),
      },
    });

    return WalletEntity.fromModel(wallet);
  }

  async updateBalances(walletId: string, balances: { balanceGrams?: Prisma.Decimal; lockedGrams?: Prisma.Decimal }) {
    const wallet = await this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        balanceGrams: balances.balanceGrams,
        lockedGrams: balances.lockedGrams,
      },
    });

    return WalletEntity.fromModel(wallet);
  }
}

