import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Kids Wallet Validation Service
 *
 * Handles all business rule validations for Kids Wallets
 * Single Responsibility: Validate kids wallet operations
 */
@Injectable()
export class KidsWalletValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate parent user exists and is not a kid account
   */
  async validateParentUser(parentUserId: string): Promise<void> {
    const parent = await this.prisma.user.findUnique({
      where: { id: parentUserId },
    });

    if (!parent) {
      throw new NotFoundException(`Parent user ${parentUserId} not found`);
    }

    if (parent.isKidsAccount) {
      throw new BadRequestException('A kid account cannot create other kid accounts');
    }
  }

  /**
   * Validate kid is under 18 years old
   */
  validateAge(dateOfBirth: Date): void {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;

    if (actualAge >= 18) {
      throw new BadRequestException('Kid account can only be created for minors (under 18 years)');
    }

    if (actualAge < 0) {
      throw new BadRequestException('Invalid date of birth');
    }
  }

  /**
   * Validate parent-child relationship
   */
  async validateParentChildRelationship(parentUserId: string, kidUserId: string): Promise<void> {
    const kid = await this.prisma.user.findUnique({
      where: { id: kidUserId },
    });

    if (!kid) {
      throw new NotFoundException(`Kid user ${kidUserId} not found`);
    }

    if (!kid.isKidsAccount) {
      throw new BadRequestException('User is not a kid account');
    }

    if (kid.parentUserId !== parentUserId) {
      throw new BadRequestException('User is not a child of this parent');
    }
  }

  /**
   * Validate parent has sufficient balance for transfer
   */
  async validateParentBalance(parentUserId: string, amountGrams: number): Promise<void> {
    const wallet = await this.prisma.wallet.findUnique({
      where: {
        userId_type: {
          userId: parentUserId,
          type: 'GOLD',
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Parent wallet not found');
    }

    const availableBalance = Number(wallet.balanceGrams) - Number(wallet.lockedGrams);

    if (availableBalance < amountGrams) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${availableBalance}g, Required: ${amountGrams}g`
      );
    }
  }

  /**
   * Validate gold amount follows 0.1gm multiples rule
   */
  validateGoldAmount(goldGrams: number): void {
    // Must be multiple of 0.1
    const remainder = goldGrams % 0.1;
    if (Math.abs(remainder) > 0.00001) { // Using small epsilon for floating point comparison
      throw new BadRequestException(
        `Gold amount must be in multiples of 0.1 grams. Received: ${goldGrams}g`
      );
    }

    if (goldGrams < 0.1) {
      throw new BadRequestException('Minimum transfer amount is 0.1 grams');
    }
  }
}
