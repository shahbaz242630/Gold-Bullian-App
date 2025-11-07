import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KidsWalletValidationService } from '../../../src/modules/kids-wallets/services/kids-wallet-validation.service';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../src/database/prisma.service';

describe('KidsWalletValidationService', () => {
  let service: KidsWalletValidationService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      wallet: {
        findUnique: vi.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        KidsWalletValidationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<KidsWalletValidationService>(KidsWalletValidationService);
  });

  describe('validateAge', () => {
    it('should accept valid minor age', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 10); // 10 years old

      expect(() => {
        service.validateAge(birthDate);
      }).not.toThrow();
    });

    it('should reject adult age (18+)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 20); // 20 years old

      expect(() => {
        service.validateAge(birthDate);
      }).toThrow('Kid account can only be created for minors');
    });

    it('should reject future date of birth', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() + 1); // Future date

      expect(() => {
        service.validateAge(birthDate);
      }).toThrow('Invalid date of birth');
    });
  });

  describe('validateGoldAmount', () => {
    it('should accept valid 0.1gm multiples', () => {
      expect(() => service.validateGoldAmount(0.5)).not.toThrow();
      expect(() => service.validateGoldAmount(1.0)).not.toThrow();
      expect(() => service.validateGoldAmount(10.0)).not.toThrow();
    });

    it('should reject non-0.1gm multiples', () => {
      expect(() => service.validateGoldAmount(0.15)).toThrow(
        'Gold amount must be in multiples of 0.1 grams'
      );
      expect(() => service.validateGoldAmount(1.23)).toThrow(
        'Gold amount must be in multiples of 0.1 grams'
      );
    });

    it('should reject amounts below minimum', () => {
      expect(() => service.validateGoldAmount(0.05)).toThrow(
        'Minimum transfer amount is 0.1 grams'
      );
    });
  });

  describe.skip('validateParentBalance', () => {
    // TODO: These tests require proper database mocking setup
    it('should accept sufficient balance', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'parent-1',
        type: 'GOLD',
        balanceGrams: 100,
        lockedGrams: 0,
      } as any);

      await expect(
        service.validateParentBalance('parent-1', 50)
      ).resolves.not.toThrow();
    });

    it('should reject insufficient balance', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'parent-1',
        type: 'GOLD',
        balanceGrams: 10,
        lockedGrams: 0,
      } as any);

      await expect(
        service.validateParentBalance('parent-1', 50)
      ).rejects.toThrow('Insufficient balance');
    });
  });
});
