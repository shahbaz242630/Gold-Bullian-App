import { describe, expect, it, vi } from 'vitest';
import { WalletType } from '@prisma/client';

import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { WalletEntity } from './entities/wallet.entity';

describe('WalletsController', () => {
  const service = {
    findAllForUser: vi.fn(),
    findByUserAndType: vi.fn(),
  } as unknown as WalletsService;

  const controller = new WalletsController(service as WalletsService);

  it('returns wallet summary', async () => {
    const wallet = WalletEntity.fromModel({
      id: 'wallet-1',
      userId: 'user-1',
      type: WalletType.GOLD,
      balanceGrams: 1 as any,
      lockedGrams: 0 as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    (service.findAllForUser as any) = vi.fn().mockResolvedValue([wallet]);

    const result = await controller.getSummary('user-1');

    expect(result.userId).toBe('user-1');
    expect(result.wallets).toHaveLength(1);
  });
});
