import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../database/prisma.service';
import { CreatePriceSnapshotDto } from './dto/create-price-snapshot.dto';
import { UpsertPriceOverrideDto } from './dto/upsert-price-override.dto';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  let prisma: PrismaService;
  let service: PricingService;

  beforeEach(() => {
    prisma = {
      goldPriceSnapshot: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      priceOverride: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
    } as unknown as PrismaService;

    service = new PricingService(prisma);
  });

  it('records a snapshot with defaults', async () => {
    const dto: CreatePriceSnapshotDto = {
      source: 'lbma',
      buyPrice: 250.123,
      sellPrice: 248.456,
      currency: 'AED',
    };

    (prisma.goldPriceSnapshot.create as any).mockResolvedValue({ id: 'snap-1' });

    const result = await service.recordSnapshot(dto);

    expect(prisma.goldPriceSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: 'lbma',
        currency: 'AED',
      }),
    });
    expect(result.id).toBe('snap-1');
  });

  it('prefers overrides when present', async () => {
    (prisma.priceOverride.findFirst as any).mockResolvedValue({
      buyPrice: new Prisma.Decimal(255.1),
      sellPrice: new Prisma.Decimal(250.9),
      currency: 'AED',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      reason: 'Manual override',
    });

    const quote = await service.getEffectiveQuote();

    expect(quote.isOverride).toBe(true);
    expect(quote.buyPrice).toBe('255.1');
    expect(quote.overrideReason).toBe('Manual override');
  });

  it('falls back to latest snapshot when no override exists', async () => {
    (prisma.priceOverride.findFirst as any).mockResolvedValue(null);
    (prisma.goldPriceSnapshot.findFirst as any).mockResolvedValue({
      source: 'market-feed',
      buyPrice: new Prisma.Decimal(240.2),
      sellPrice: new Prisma.Decimal(238.7),
      currency: 'AED',
      effectiveAt: new Date('2025-01-02T00:00:00Z'),
    });

    const quote = await service.getEffectiveQuote();

    expect(quote.isOverride).toBe(false);
    expect(quote.source).toBe('market-feed');
    expect(quote.buyPrice).toBe('240.2');
  });

  it('throws when no snapshot or override exists', async () => {
    (prisma.priceOverride.findFirst as any).mockResolvedValue(null);
    (prisma.goldPriceSnapshot.findFirst as any).mockResolvedValue(null);

    await expect(service.getEffectiveQuote()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates overrides with decimals', async () => {
    const dto: UpsertPriceOverrideDto = {
      adminId: 'admin-1',
      buyPrice: 260.5,
      sellPrice: 258.3,
      currency: 'AED',
      reason: 'Round robin',
    };

    (prisma.priceOverride.create as any).mockResolvedValue({ id: 'ovr-1' });

    const result = await service.upsertOverride(dto);

    expect(prisma.priceOverride.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ adminId: 'admin-1' }),
    });
    expect(result.id).toBe('ovr-1');
  });
});
