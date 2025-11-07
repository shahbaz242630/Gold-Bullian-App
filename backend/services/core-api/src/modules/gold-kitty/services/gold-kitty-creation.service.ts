import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateGoldKittyDto } from '../dto/create-gold-kitty.dto';
import { GoldKittyEntity } from '../entities/gold-kitty.entity';
import { GoldKittyValidationService } from './gold-kitty-validation.service';

/**
 * Gold Kitty Creation Service
 *
 * Handles creating new Gold Kitty groups
 * Single Responsibility: Kitty creation and initialization
 */
@Injectable()
export class GoldKittyCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: GoldKittyValidationService,
  ) {}

  /**
   * Create a new Gold Kitty group
   * Owner is automatically added as first member
   */
  async createKitty(dto: CreateGoldKittyDto): Promise<GoldKittyEntity> {
    // Validate business rules
    await this.validationService.validateKittyCreation(
      dto.totalRounds,
      dto.monthlyAmountAED
    );

    // Create kitty with owner as first member in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the kitty
      const kitty = await tx.goldKitty.create({
        data: {
          ownerId: dto.ownerId,
          name: dto.name,
          description: dto.description,
          monthlyAmountAED: new Prisma.Decimal(dto.monthlyAmountAED),
          contributionDay: dto.contributionDay,
          startDate: new Date(dto.startDate),
          totalRounds: dto.totalRounds,
          metadata: dto.metadata as Prisma.InputJsonValue,
        },
      });

      // Add owner as first member with allocation order 1
      await tx.goldKittyMember.create({
        data: {
          kittyId: kitty.id,
          userId: dto.ownerId,
          allocationOrder: 1,
        },
      });

      return kitty;
    });

    return GoldKittyEntity.fromModel(result);
  }

  /**
   * Calculate next round date based on contribution day
   */
  calculateNextRoundDate(currentDate: Date, contributionDay: number): Date {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextDate.setDate(Math.min(contributionDay, this.getDaysInMonth(nextDate)));
    return nextDate;
  }

  /**
   * Get number of days in a month
   */
  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }
}
