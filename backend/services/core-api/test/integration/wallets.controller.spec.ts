import { describe, expect, it, vi } from 'vitest';
import { WalletType } from '@prisma/client';

import { WalletsController } from '../../src/modules/wallets/wallets.controller';
import { WalletsService } from '../../src/modules/wallets/wallets.service';
import { WalletEntity } from '../../src/modules/wallets/entities/wallet.entity';

describe('WalletsController', () => {
  it('maps wallet summary responses', async () => {
    const service = {
      findAllForUser: vi.fn().mockResolvedValue([
        WalletEntity.fromModel({
          id: 'wallet-1',
          userId: 'user-1',
          type: WalletType.GOLD,
          balanceGrams: 1 as any,
          lockedGrams: 0 as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]),
      findByUserAndType: vi.fn(),
    } as unknown as WalletsService;

    const controller = new WalletsController(service);
    const response = await controller.getSummary('user-1');

    expect(response.userId).toBe('user-1');
    expect(response.wallets).toHaveLength(1);
  });
});
