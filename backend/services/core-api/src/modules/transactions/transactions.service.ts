import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType, WalletType } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../../database/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BuyGoldDto } from './dto/buy-gold.dto';
import { SellGoldDto } from './dto/sell-gold.dto';
import { WithdrawCashDto } from './dto/withdraw-cash.dto';
import { WithdrawPhysicalDto } from './dto/withdraw-physical.dto';
import { TransactionEntity } from './entities/transaction.entity';

interface RecordTransactionResult {
  transaction: TransactionEntity;
  wallet: WalletEntity;
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

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

  async buyGold(dto: BuyGoldDto) {
    const quote = await this.pricingService.getEffectiveQuote();
    if (dto.goldGrams === undefined && dto.fiatAmount === undefined) {
      throw new BadRequestException('Either goldGrams or fiatAmount must be provided for buy transactions.');
    }

    const pricePerGram = new Prisma.Decimal(quote.buyPrice);
    const feeAmount = new Prisma.Decimal(dto.feeAmount ?? 0);

    const hasGrams = dto.goldGrams !== undefined;
    const goldGramsDecimal = hasGrams
      ? new Prisma.Decimal(dto.goldGrams!)
      : new Prisma.Decimal(dto.fiatAmount!).div(pricePerGram);
    const fiatAmountDecimal = hasGrams
      ? goldGramsDecimal.mul(pricePerGram)
      : new Prisma.Decimal(dto.fiatAmount!);

    const result = await this.record({
      userId: dto.userId,
      walletType: WalletType.GOLD,
      type: TransactionType.BUY,
      goldGrams: Number(goldGramsDecimal.toFixed(8)),
      fiatAmount: this.toNumber(fiatAmountDecimal, 2),
      feeAmount: this.toNumber(feeAmount, 2),
      fiatCurrency: dto.currency ?? quote.currency,
      metadata: {
        priceSource: quote.source,
        pricePerGram: pricePerGram.toString(),
      },
    });

    return result;
  }

  async sellGold(dto: SellGoldDto) {
    const quote = await this.pricingService.getEffectiveQuote();
    const pricePerGram = new Prisma.Decimal(quote.sellPrice);

    const goldGramsDecimal = new Prisma.Decimal(dto.goldGrams);
    const feeAmountDecimal = new Prisma.Decimal(dto.feeAmount ?? 0);
    const fiatAmountDecimal = goldGramsDecimal.mul(pricePerGram);

    const result = await this.record({
      userId: dto.userId,
      walletType: WalletType.GOLD,
      type: TransactionType.SELL,
      goldGrams: Number(goldGramsDecimal.toFixed(8)),
      fiatAmount: this.toNumber(fiatAmountDecimal, 2),
      feeAmount: this.toNumber(feeAmountDecimal, 2),
      fiatCurrency: dto.currency ?? quote.currency,
      metadata: {
        priceSource: quote.source,
        pricePerGram: pricePerGram.toString(),
      },
    });

    return result;
  }

  async withdrawCash(dto: WithdrawCashDto) {
    const result = await this.record({
      userId: dto.userId,
      walletType: WalletType.GOLD,
      type: TransactionType.WITHDRAW_CASH,
      goldGrams: dto.goldGrams,
      fiatAmount: dto.fiatAmount,
      feeAmount: dto.feeAmount ?? 0,
      fiatCurrency: dto.currency,
      metadata: dto.metadata,
    });

    return result;
  }

  async withdrawPhysical(dto: WithdrawPhysicalDto) {
    const result = await this.record({
      userId: dto.userId,
      walletType: WalletType.GOLD,
      type: TransactionType.WITHDRAW_PHYSICAL,
      goldGrams: dto.goldGrams,
      fiatAmount: dto.valuationAmount ?? 0,
      feeAmount: dto.feeAmount ?? 0,
      fiatCurrency: dto.currency,
      metadata: {
        fulfillmentPartner: dto.fulfillmentPartner,
        denomination: dto.denomination,
        ...dto.metadata,
      },
    });

    return result;
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

  private toNumber(decimal: Prisma.Decimal, precision: number) {
    return Number(decimal.toFixed(precision));
  }
}
