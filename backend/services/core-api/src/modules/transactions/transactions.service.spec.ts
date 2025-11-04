import { BadRequestException } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType, WalletType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../database/prisma.service';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

const buildWallet = () => ({
  id: 'wallet-1',
  userId: 'user-1',
  type: WalletType.GOLD,
  balanceGrams: new Prisma.Decimal(1),
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

    service = new TransactionsService(prisma);
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
    expect(result.wallet.balanceGrams).toBe('1.5');
    expect((prisma.$transaction as any)).toHaveBeenCalled();
  });

  it('throws when balance would go negative', async () => {
    const request: CreateTransactionDto = {
      userId: 'user-1',
      walletType: WalletType.GOLD,
      type: TransactionType.SELL,
      goldGrams: 5,
      fiatAmount: 100,
      feeAmount: 0,
      fiatCurrency: 'AED',
    };

    await expect(service.record(request)).rejects.toBeInstanceOf(BadRequestException);
  });
});
