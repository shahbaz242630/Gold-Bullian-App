import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreatePriceSnapshotDto } from './dto/create-price-snapshot.dto';
import { UpsertPriceOverrideDto } from './dto/upsert-price-override.dto';
import { PriceQuoteEntity } from './entities/price-quote.entity';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async recordSnapshot(dto: CreatePriceSnapshotDto) {
    const effectiveAt = dto.effectiveAt ?? new Date();

    return this.prisma.goldPriceSnapshot.create({
      data: {
        source: dto.source,
        buyPrice: new Prisma.Decimal(dto.buyPrice),
        sellPrice: new Prisma.Decimal(dto.sellPrice),
        currency: dto.currency,
        effectiveAt,
      },
    });
  }

  async upsertOverride(dto: UpsertPriceOverrideDto) {
    return this.prisma.priceOverride.create({
      data: {
        adminId: dto.adminId,
        buyPrice: new Prisma.Decimal(dto.buyPrice),
        sellPrice: new Prisma.Decimal(dto.sellPrice),
        currency: dto.currency,
        reason: dto.reason,
        expiresAt: dto.expiresAt,
      },
    });
  }

  async getEffectiveQuote(): Promise<PriceQuoteEntity> {
    const override = await this.findActiveOverride();

    if (override) {
      return PriceQuoteEntity.create({
        source: 'override',
        buyPrice: override.buyPrice.toString(),
        sellPrice: override.sellPrice.toString(),
        currency: override.currency,
        effectiveAt: override.createdAt,
        overrideReason: override.reason,
        isOverride: true,
      });
    }

    const snapshot = await this.prisma.goldPriceSnapshot.findFirst({
      orderBy: { effectiveAt: 'desc' },
    });

    if (!snapshot) {
      throw new NotFoundException('No gold price snapshot available.');
    }

    return PriceQuoteEntity.create({
      source: snapshot.source,
      buyPrice: snapshot.buyPrice.toString(),
      sellPrice: snapshot.sellPrice.toString(),
      currency: snapshot.currency,
      effectiveAt: snapshot.effectiveAt,
      isOverride: false,
    });
  }

  async listSnapshots(limit = 50) {
    return this.prisma.goldPriceSnapshot.findMany({
      orderBy: { effectiveAt: 'desc' },
      take: limit,
    });
  }

  private async findActiveOverride() {
    const now = new Date();
    return this.prisma.priceOverride.findFirst({
      where: {
        OR: [
          { expiresAt: null },
          {
            expiresAt: {
              gt: now,
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
