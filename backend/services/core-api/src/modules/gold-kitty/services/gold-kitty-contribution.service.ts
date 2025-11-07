import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ContributeDto } from '../dto/contribute.dto';
import { GoldKittyContributionEntity } from '../entities/gold-kitty-contribution.entity';

/**
 * Gold Kitty Contribution Service
 *
 * Handles monthly contribution tracking and payment
 * Single Responsibility: Contribution management
 */
@Injectable()
export class GoldKittyContributionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a contribution for a member
   * This creates the contribution record (payment happens separately)
   */
  async recordContribution(
    dto: ContributeDto,
    goldGrams: number,
    transactionId?: string
  ): Promise<GoldKittyContributionEntity> {
    // Verify member exists
    const member = await this.prisma.goldKittyMember.findUnique({
      where: { id: dto.memberId },
    });

    if (!member) {
      throw new NotFoundException(`Member ${dto.memberId} not found`);
    }

    // Get kitty to get monthly amount
    const kitty = await this.prisma.goldKitty.findUnique({
      where: { id: dto.kittyId },
    });

    if (!kitty) {
      throw new NotFoundException(`Kitty ${dto.kittyId} not found`);
    }

    // Create or update contribution
    const contribution = await this.prisma.goldKittyContribution.upsert({
      where: {
        kittyId_memberId_roundNumber: {
          kittyId: dto.kittyId,
          memberId: dto.memberId,
          roundNumber: dto.roundNumber,
        },
      },
      create: {
        kittyId: dto.kittyId,
        memberId: dto.memberId,
        roundNumber: dto.roundNumber,
        amountAED: kitty.monthlyAmountAED,
        goldGrams: new Prisma.Decimal(goldGrams),
        transactionId,
        contributedAt: transactionId ? new Date() : null,
        isPaid: !!transactionId,
      },
      update: {
        goldGrams: new Prisma.Decimal(goldGrams),
        transactionId,
        contributedAt: transactionId ? new Date() : null,
        isPaid: !!transactionId,
      },
    });

    return GoldKittyContributionEntity.fromModel(contribution);
  }

  /**
   * Get all contributions for a specific round
   */
  async getRoundContributions(
    kittyId: string,
    roundNumber: number
  ): Promise<GoldKittyContributionEntity[]> {
    const contributions = await this.prisma.goldKittyContribution.findMany({
      where: { kittyId, roundNumber },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return contributions.map(GoldKittyContributionEntity.fromModel);
  }

  /**
   * Get all contributions for a member across all rounds
   */
  async getMemberContributions(memberId: string): Promise<GoldKittyContributionEntity[]> {
    const contributions = await this.prisma.goldKittyContribution.findMany({
      where: { memberId },
      orderBy: { roundNumber: 'asc' },
    });

    return contributions.map(GoldKittyContributionEntity.fromModel);
  }

  /**
   * Calculate total contributions for a round
   */
  async calculateRoundTotal(
    kittyId: string,
    roundNumber: number
  ): Promise<{ totalAED: number; totalGrams: number }> {
    const contributions = await this.prisma.goldKittyContribution.findMany({
      where: { kittyId, roundNumber, isPaid: true },
    });

    const totalAED = contributions.reduce(
      (sum, c) => sum + Number(c.amountAED),
      0
    );
    const totalGrams = contributions.reduce(
      (sum, c) => sum + Number(c.goldGrams),
      0
    );

    return { totalAED, totalGrams };
  }

  /**
   * Check if a member has paid for a specific round
   */
  async hasMemberPaid(
    kittyId: string,
    memberId: string,
    roundNumber: number
  ): Promise<boolean> {
    const contribution = await this.prisma.goldKittyContribution.findUnique({
      where: {
        kittyId_memberId_roundNumber: {
          kittyId,
          memberId,
          roundNumber,
        },
      },
    });

    return contribution?.isPaid ?? false;
  }
}
