import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Gold Kitty Validation Service
 *
 * Handles all business rule validations for Gold Kitty
 * Single Responsibility: Validate kitty operations
 */
@Injectable()
export class GoldKittyValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate kitty creation rules
   */
  async validateKittyCreation(totalRounds: number, monthlyAmountAED: number): Promise<void> {
    if (totalRounds < 2 || totalRounds > 12) {
      throw new BadRequestException('Total rounds must be between 2 and 12');
    }

    if (monthlyAmountAED < 10) {
      throw new BadRequestException('Monthly amount must be at least 10 AED');
    }
  }

  /**
   * Validate that total members equals total rounds
   */
  async validateMemberCount(kittyId: string, totalRounds: number): Promise<void> {
    const memberCount = await this.prisma.goldKittyMember.count({
      where: { kittyId, isActive: true },
    });

    if (memberCount >= totalRounds) {
      throw new BadRequestException(
        `Kitty is full. Maximum members: ${totalRounds}, Current: ${memberCount}`
      );
    }
  }

  /**
   * Validate allocation order is unique
   */
  async validateAllocationOrder(kittyId: string, allocationOrder: number): Promise<void> {
    const existing = await this.prisma.goldKittyMember.findFirst({
      where: { kittyId, allocationOrder, isActive: true },
    });

    if (existing) {
      throw new BadRequestException(
        `Allocation order ${allocationOrder} is already taken`
      );
    }
  }

  /**
   * Validate all contributions are paid before allocation
   */
  async validateAllContributionsPaid(kittyId: string, roundNumber: number): Promise<boolean> {
    const totalMembers = await this.prisma.goldKittyMember.count({
      where: { kittyId, isActive: true },
    });

    const paidContributions = await this.prisma.goldKittyContribution.count({
      where: { kittyId, roundNumber, isPaid: true },
    });

    if (paidContributions < totalMembers) {
      throw new BadRequestException(
        `Cannot allocate pot. Only ${paidContributions}/${totalMembers} members have paid for round ${roundNumber}`
      );
    }

    return true;
  }

  /**
   * Validate no duplicate allocation for same round
   */
  async validateNoDuplicateAllocation(kittyId: string, roundNumber: number): Promise<void> {
    const existing = await this.prisma.goldKittyAllocation.findFirst({
      where: { kittyId, roundNumber },
    });

    if (existing) {
      throw new BadRequestException(
        `Round ${roundNumber} has already been allocated`
      );
    }
  }

  /**
   * Validate member hasn't already received pot
   */
  async validateMemberEligibleForPot(memberId: string): Promise<void> {
    const member = await this.prisma.goldKittyMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new BadRequestException('Member not found');
    }

    if (member.hasReceivedPot) {
      throw new BadRequestException('Member has already received their pot allocation');
    }

    if (!member.isActive) {
      throw new BadRequestException('Member is not active');
    }
  }
}
