import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AllocatePotDto } from '../dto/allocate-pot.dto';
import { GoldKittyAllocationEntity } from '../entities/gold-kitty-allocation.entity';
import { GoldKittyValidationService } from './gold-kitty-validation.service';
import { GoldKittyContributionService } from './gold-kitty-contribution.service';

/**
 * Gold Kitty Allocation Service
 *
 * Handles pot distribution to members
 * Single Responsibility: Pot allocation logic
 */
@Injectable()
export class GoldKittyAllocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: GoldKittyValidationService,
    private readonly contributionService: GoldKittyContributionService,
  ) {}

  /**
   * Allocate the pot to a member for a specific round
   * All members must have paid their contributions before allocation
   */
  async allocatePot(dto: AllocatePotDto): Promise<GoldKittyAllocationEntity> {
    // Validate all contributions are paid
    await this.validationService.validateAllContributionsPaid(
      dto.kittyId,
      dto.roundNumber
    );

    // Validate no duplicate allocation
    await this.validationService.validateNoDuplicateAllocation(
      dto.kittyId,
      dto.roundNumber
    );

    // Validate member is eligible
    await this.validationService.validateMemberEligibleForPot(dto.memberId);

    // Calculate total pot for this round
    const { totalAED, totalGrams } = await this.contributionService.calculateRoundTotal(
      dto.kittyId,
      dto.roundNumber
    );

    // Allocate pot in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create allocation record
      const allocation = await tx.goldKittyAllocation.create({
        data: {
          kittyId: dto.kittyId,
          memberId: dto.memberId,
          roundNumber: dto.roundNumber,
          totalGoldGrams: new Prisma.Decimal(totalGrams),
          totalAmountAED: new Prisma.Decimal(totalAED),
        },
      });

      // Mark member as having received pot
      await tx.goldKittyMember.update({
        where: { id: dto.memberId },
        data: { hasReceivedPot: true },
      });

      // Update kitty current round
      await tx.goldKitty.update({
        where: { id: dto.kittyId },
        data: { currentRound: dto.roundNumber + 1 },
      });

      // TODO: Transfer gold to member's wallet
      // This would integrate with the wallet service
      // await this.walletService.addGold(member.userId, totalGrams);

      return allocation;
    });

    return GoldKittyAllocationEntity.fromModel(result);
  }

  /**
   * Get all allocations for a kitty
   */
  async getKittyAllocations(kittyId: string): Promise<GoldKittyAllocationEntity[]> {
    const allocations = await this.prisma.goldKittyAllocation.findMany({
      where: { kittyId },
      orderBy: { roundNumber: 'asc' },
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

    return allocations.map(GoldKittyAllocationEntity.fromModel);
  }

  /**
   * Get allocations received by a specific member
   */
  async getMemberAllocations(memberId: string): Promise<GoldKittyAllocationEntity[]> {
    const allocations = await this.prisma.goldKittyAllocation.findMany({
      where: { memberId },
      orderBy: { allocatedAt: 'desc' },
    });

    return allocations.map(GoldKittyAllocationEntity.fromModel);
  }

  /**
   * Get allocation for a specific round
   */
  async getRoundAllocation(
    kittyId: string,
    roundNumber: number
  ): Promise<GoldKittyAllocationEntity | null> {
    const allocation = await this.prisma.goldKittyAllocation.findUnique({
      where: {
        kittyId_roundNumber: {
          kittyId,
          roundNumber,
        },
      },
    });

    return allocation ? GoldKittyAllocationEntity.fromModel(allocation) : null;
  }
}
