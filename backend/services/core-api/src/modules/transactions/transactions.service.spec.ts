import { BadRequestException } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType, WalletType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../database/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BuyGoldDto } from './dto/buy-gold.dto';
import { SellGoldDto } from './dto/sell-gold.dto';

const buildWallet = () => ({
  id: 'wallet-1',
  userId: 'user-1',
  type: WalletType.GOLD,
  balanceGrams: new Prisma.Decimal(5),
  lockedGrams: new Prisma.Decimal(0),
  createdAt: new Date(),
  updatedAt: new Date(),
});

const buildTransactionBase = () => ({
  id: 'txn-1',
  userId: 'user-1',
  walletId: 'wallet-1',
  type: TransactionType.BUY,
  status: TransactionStatus.COMPLETED,
  goldGrams: new Prisma.Decimal(0.5),
  fiatAmount: new Prisma.Decimal(100),
  fiatCurrency: 'AED',
  feeAmount: new Prisma.Decimal(0),
  feeCurrency: 'AED',
  referenceCode: 'BUY-1234',
  metadata: null,
  completedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('TransactionsService', () => {
  let prisma: PrismaService;
  let pricingService: PricingService;
  let service: TransactionsService;
  let wallet: ReturnType<typeof buildWallet>;

  beforeEach(() => {
    wallet = buildWallet();

    const trx = {
      wallet: {
        findUnique: vi.fn().mockResolvedValue(wallet),
        update: vi.fn().mockImplementation(async ({ data }) => ({
          ...wallet,
          balanceGrams: data.balanceGrams ?? wallet.balanceGrams,
          updatedAt: new Date(),
        })),
      },
      transaction: {
        create: vi.fn().mockImplementation(async ({ data }) => ({
          ...buildTransactionBase(),
          ...data,
          id: 'txn-1',
        })),
      },
    };

    prisma = {
      $transaction: vi.fn((cb: any) => cb(trx)),
      wallet: trx.wallet,
      transaction: trx.transaction,
    } as unknown as PrismaService;

    pricingService = {
      getEffectiveQuote: vi.fn().mockResolvedValue({
        source: 'override',
        buyPrice: '250.5',
        sellPrice: '249.1',
        currency: 'AED',
        effectiveAt: new Date(),
        isOverride: true,
      }),
    } as unknown as PricingService;

    service = new TransactionsService(prisma, pricingService);
  });

  it('records a buy transaction and updates balance', async () => {
    const request: CreateTransactionDto = {
      userId: 'user-1',
      walletType: WalletType.GOLD,
      type: TransactionType.BUY,
      goldGrams: 0.5,
      fiatAmount: 100,
      feeAmount: 0,
      fiatCurrency: 'AED',
    };

    const result = await service.record(request);

    expect(result.transaction.type).toBe(TransactionType.BUY);
    expect(result.wallet.balanceGrams).toBe('5.5');
    expect((prisma.$transaction as any)).toHaveBeenCalled();
  });

  it('throws when balance would go negative', async () => {
    const request: CreateTransactionDto = {
      userId: 'user-1',
      walletType: WalletType.GOLD,
      type: TransactionType.SELL,
      goldGrams: 10,
      fiatAmount: 100,
      feeAmount: 0,
      fiatCurrency: 'AED',
    };

    await expect(service.record(request)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('computes gold grams from fiat when buying', async () => {
    const dto: BuyGoldDto = {
      userId: 'user-1',
      fiatAmount: 100,
    };

    const result = await service.buyGold(dto);

    expect(result.transaction.type).toBe(TransactionType.BUY);
    expect((pricingService.getEffectiveQuote as any)).toHaveBeenCalled();
    expect(Number(result.transaction.goldGrams)).toBeGreaterThan(0);
  });

  it('uses sell price when selling gold', async () => {
    (pricingService.getEffectiveQuote as any).mockResolvedValue({
      source: 'market',
      buyPrice: '250.5',
      sellPrice: '245.0',
      currency: 'AED',
      effectiveAt: new Date(),
      isOverride: false,
    });

    const dto: SellGoldDto = {
      userId: 'user-1',
      goldGrams: 1.25,
    };

    const result = await service.sellGold(dto);

    expect(result.transaction.type).toBe(TransactionType.SELL);
    expect(Number(result.transaction.fiatAmount)).toBeCloseTo(306.25, 2);
  });
});




