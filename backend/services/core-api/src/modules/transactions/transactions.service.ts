import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../../database/prisma.service';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionEntity } from './entities/transaction.entity';

interface RecordTransactionResult {
  transaction: TransactionEntity;
  wallet: WalletEntity;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByUser(userId: string, limit = 50, cursor?: string) {
    const items = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    return items.map(TransactionEntity.fromModel);
  }

  async record(dto: CreateTransactionDto): Promise<RecordTransactionResult> {
    return this.prisma.$transaction(async (trx) => {
      const wallet = await trx.wallet.findUnique({
        where: { userId_type: { userId: dto.userId, type: dto.walletType } },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet ${dto.walletType} not found for user ${dto.userId}`);
      }

      const goldDelta = this.getGoldDelta(dto.type, new Prisma.Decimal(dto.goldGrams));
      const balanceAfter = wallet.balanceGrams.add(goldDelta);

      if (balanceAfter.isNegative()) {
        throw new BadRequestException('Insufficient gold balance for this transaction.');
      }

      const transaction = await trx.transaction.create({
        data: {
          userId: dto.userId,
          walletId: wallet.id,
          type: dto.type,
          status: TransactionStatus.COMPLETED,
          goldGrams: new Prisma.Decimal(dto.goldGrams),
          fiatAmount: new Prisma.Decimal(dto.fiatAmount),
          fiatCurrency: dto.fiatCurrency,
          feeAmount: new Prisma.Decimal(dto.feeAmount ?? 0),
          feeCurrency: dto.fiatCurrency,
          referenceCode: dto.referenceCode ?? this.createReference(dto.type),
          metadata: dto.metadata as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      const updatedWallet = await trx.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceGrams: balanceAfter,
        },
      });

      return {
        transaction: TransactionEntity.fromModel(transaction),
        wallet: WalletEntity.fromModel(updatedWallet),
      };
    });
  }

  private getGoldDelta(type: TransactionType, amount: Prisma.Decimal): Prisma.Decimal {
    switch (type) {
      case TransactionType.BUY:
        return amount;
      case TransactionType.SELL:
      case TransactionType.WITHDRAW_CASH:
      case TransactionType.WITHDRAW_PHYSICAL:
        return amount.negated();
      case TransactionType.ADJUSTMENT:
        return amount;
      default:
        throw new BadRequestException('Unsupported transaction type.');
    }
  }

  private createReference(type: TransactionType): string {
    const prefix = type.substring(0, 3).toUpperCase();
    return `${prefix}-${randomUUID().split('-')[0]}`;
  }
}
