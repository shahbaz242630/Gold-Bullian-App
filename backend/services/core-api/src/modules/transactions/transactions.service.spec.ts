import { BadRequestException } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType, WalletType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionsService } from './transactions.service';
import { BuyGoldDto } from './dto/buy-gold.dto';
import { SellGoldDto } from './dto/sell-gold.dto';
import { BuyGoldService } from './services/buy-gold.service';
import { SellGoldService } from './services/sell-gold.service';
import { WithdrawCashService } from './services/withdraw-cash.service';
import { WithdrawPhysicalService } from './services/withdraw-physical.service';
import { TransactionsOrchestratorService } from './services/transactions-orchestrator.service';

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
  let orchestrator: TransactionsOrchestratorService;
  let buyGoldService: BuyGoldService;
  let sellGoldService: SellGoldService;
  let withdrawCashService: WithdrawCashService;
  let withdrawPhysicalService: WithdrawPhysicalService;
  let service: TransactionsService;
  let wallet: ReturnType<typeof buildWallet>;

  beforeEach(() => {
    wallet = buildWallet();

    // Mock the orchestrator
    orchestrator = {
      listByUser: vi.fn(),
      record: vi.fn(),
    } as unknown as TransactionsOrchestratorService;

    // Mock the specialized services with proper mocked responses
    buyGoldService = {
      execute: vi.fn().mockResolvedValue({
        transaction: {
          ...buildTransactionBase(),
          type: TransactionType.BUY,
          goldGrams: new Prisma.Decimal(0.4),
        },
        wallet: {
          ...wallet,
          balanceGrams: new Prisma.Decimal(5.4),
        },
      }),
    } as unknown as BuyGoldService;

    sellGoldService = {
      execute: vi.fn().mockResolvedValue({
        transaction: {
          ...buildTransactionBase(),
          type: TransactionType.SELL,
          goldGrams: new Prisma.Decimal(1.25),
          fiatAmount: new Prisma.Decimal(306.25),
        },
        wallet: {
          ...wallet,
          balanceGrams: new Prisma.Decimal(3.75),
        },
      }),
    } as unknown as SellGoldService;

    withdrawCashService = {
      execute: vi.fn(),
    } as unknown as WithdrawCashService;

    withdrawPhysicalService = {
      execute: vi.fn(),
    } as unknown as WithdrawPhysicalService;

    service = new TransactionsService(
      orchestrator,
      buyGoldService,
      sellGoldService,
      withdrawCashService,
      withdrawPhysicalService,
    );
  });

  it('delegates buy gold to BuyGoldService', async () => {
    const dto: BuyGoldDto = {
      userId: 'user-1',
      fiatAmount: 100,
    };

    const result = await service.buyGold(dto);

    expect(buyGoldService.execute).toHaveBeenCalledWith(dto);
    expect(result.transaction.type).toBe(TransactionType.BUY);
    expect(Number(result.transaction.goldGrams)).toBe(0.4);
  });

  it('delegates sell gold to SellGoldService', async () => {
    const dto: SellGoldDto = {
      userId: 'user-1',
      goldGrams: 1.25,
    };

    const result = await service.sellGold(dto);

    expect(sellGoldService.execute).toHaveBeenCalledWith(dto);
    expect(result.transaction.type).toBe(TransactionType.SELL);
    expect(Number(result.transaction.fiatAmount)).toBe(306.25);
  });

  it('returns transaction with gold grams when buying', async () => {
    const dto: BuyGoldDto = {
      userId: 'user-1',
      fiatAmount: 100,
    };

    const result = await service.buyGold(dto);

    expect(result.transaction.type).toBe(TransactionType.BUY);
    expect(Number(result.transaction.goldGrams)).toBe(0.4);
    expect(Number(result.transaction.goldGrams)).toBeGreaterThan(0);
  });

  it('returns transaction with fiat amount when selling gold', async () => {
    const dto: SellGoldDto = {
      userId: 'user-1',
      goldGrams: 1.25,
    };

    const result = await service.sellGold(dto);

    expect(result.transaction.type).toBe(TransactionType.SELL);
    expect(Number(result.transaction.fiatAmount)).toBe(306.25);
    expect(Number(result.transaction.fiatAmount)).toBeCloseTo(306.25, 2);
  });
});
