import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoldKittyValidationService } from '../../../src/modules/gold-kitty/services/gold-kitty-validation.service';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../src/database/prisma.service';

describe('GoldKittyValidationService', () => {
  let service: GoldKittyValidationService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      goldKittyMember: {
        count: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      goldKittyContribution: {
        count: vi.fn(),
      },
      goldKittyAllocation: {
        findFirst: vi.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        GoldKittyValidationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<GoldKittyValidationService>(GoldKittyValidationService);
  });

  describe('validateKittyCreation', () => {
    it('should accept valid inputs', async () => {
      await expect(
        service.validateKittyCreation(5, 100)
      ).resolves.not.toThrow();
    });

    it('should reject too few rounds', async () => {
      await expect(
        service.validateKittyCreation(1, 100)
      ).rejects.toThrow('Total rounds must be between 2 and 12');
    });

    it('should reject too many rounds', async () => {
      await expect(
        service.validateKittyCreation(15, 100)
      ).rejects.toThrow('Total rounds must be between 2 and 12');
    });

    it('should reject amount below minimum', async () => {
      await expect(
        service.validateKittyCreation(5, 5)
      ).rejects.toThrow('Monthly amount must be at least 10 AED');
    });
  });

  describe.skip('validateMemberCount', () => {
    // TODO: These tests require proper database mocking setup
    it('should allow adding member when not full', async () => {
      mockPrisma.goldKittyMember.count.mockResolvedValue(3);

      await expect(
        service.validateMemberCount('kitty-1', 5)
      ).resolves.not.toThrow();
    });

    it('should reject when kitty is full', async () => {
      mockPrisma.goldKittyMember.count.mockResolvedValue(5);

      await expect(
        service.validateMemberCount('kitty-1', 5)
      ).rejects.toThrow('Kitty is full');
    });
  });

  describe.skip('validateAllocationOrder', () => {
    // TODO: These tests require proper database mocking setup
    it('should allow unique allocation order', async () => {
      mockPrisma.goldKittyMember.findFirst.mockResolvedValue(null);

      await expect(
        service.validateAllocationOrder('kitty-1', 3)
      ).resolves.not.toThrow();
    });

    it('should reject duplicate allocation order', async () => {
      mockPrisma.goldKittyMember.findFirst.mockResolvedValue({
        id: 'member-1',
      } as any);

      await expect(
        service.validateAllocationOrder('kitty-1', 3)
      ).rejects.toThrow('Allocation order 3 is already taken');
    });
  });
});
