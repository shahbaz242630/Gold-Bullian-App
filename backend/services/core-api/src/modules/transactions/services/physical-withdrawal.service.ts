import { Injectable } from '@nestjs/common';
import { Prisma, TransactionType, WalletType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { WithdrawPhysicalDto } from '../dto/withdraw-physical-enhanced.dto';
import { PhysicalWithdrawalValidationService } from './physical-withdrawal-validation.service';

/**
 * Physical Withdrawal Service
 *
 * Handles physical gold withdrawal with detailed coin selection and delivery options
 * Single Responsibility: Process physical withdrawals with full details
 */
@Injectable()
export class PhysicalWithdrawalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: PhysicalWithdrawalValidationService,
  ) {}

  /**
   * Process a physical withdrawal with enhanced details
   */
  async withdrawPhysical(dto: WithdrawPhysicalDto) {
    // Validate coin selection
    this.validationService.validateCoinSelection(dto.coinSize, dto.quantity);

    // Validate recipient details
    this.validationService.validateRecipientDetails(dto.recipientName, dto.recipientPhone);

    // Validate delivery method specific requirements
    this.validationService.validateDeliveryMethod(
      dto.deliveryMethod,
      dto.deliveryAddress,
      dto.partnerJewellerId,
      dto.pickupLocation
    );

    // Calculate total grams
    const totalGoldGrams = this.validationService.calculateTotalGrams(
      dto.coinSize,
      dto.quantity
    );

    // Execute withdrawal in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Get user's wallet
      const wallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId: dto.userId,
            type: WalletType.GOLD,
          },
        },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check sufficient balance
      const availableBalance = Number(wallet.balanceGrams) - Number(wallet.lockedGrams);
      if (availableBalance < totalGoldGrams) {
        throw new Error(
          `Insufficient balance. Available: ${availableBalance}g, Required: ${totalGoldGrams}g`
        );
      }

      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceGrams: {
            decrement: new Prisma.Decimal(totalGoldGrams),
          },
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: dto.userId,
          walletId: wallet.id,
          type: TransactionType.WITHDRAW_PHYSICAL,
          status: 'PENDING', // Will be updated when physically delivered
          goldGrams: new Prisma.Decimal(totalGoldGrams),
          fiatAmount: new Prisma.Decimal(0),
          fiatCurrency: dto.currency || 'AED',
          feeAmount: new Prisma.Decimal(dto.feeAmount || 0),
          referenceCode: `PHYS_WD_${Date.now()}`,
          metadata: {
            coinSize: dto.coinSize,
            quantity: dto.quantity,
            deliveryMethod: dto.deliveryMethod,
            ...dto.metadata,
          } as Prisma.InputJsonValue,
        },
      });

      // Create physical withdrawal details record
      const withdrawalDetails = await tx.physicalWithdrawalDetails.create({
        data: {
          transactionId: transaction.id,
          coinSize: dto.coinSize,
          quantity: dto.quantity,
          deliveryMethod: dto.deliveryMethod,
          partnerJewellerId: dto.partnerJewellerId,
          deliveryAddress: dto.deliveryAddress ? (dto.deliveryAddress as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          pickupLocation: dto.pickupLocation,
          recipientName: dto.recipientName,
          recipientPhone: dto.recipientPhone,
          specialInstructions: dto.specialInstructions,
        },
      });

      return {
        transaction,
        withdrawalDetails,
        totalGoldGrams,
        coinSizeDisplay: this.validationService.getCoinSizeDisplayName(dto.coinSize),
      };
    });

    return result;
  }

  /**
   * Get withdrawal details by transaction ID
   */
  async getWithdrawalDetails(transactionId: string) {
    const details = await this.prisma.physicalWithdrawalDetails.findUnique({
      where: { transactionId },
      include: {
        transaction: {
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

    if (!details) {
      throw new Error(`Withdrawal details not found for transaction ${transactionId}`);
    }

    return {
      ...details,
      coinSizeDisplay: this.validationService.getCoinSizeDisplayName(details.coinSize),
      totalGrams: this.validationService.calculateTotalGrams(
        details.coinSize,
        details.quantity
      ),
    };
  }

  /**
   * Update delivery tracking (for admin/fulfillment partner)
   */
  async updateDeliveryTracking(
    transactionId: string,
    trackingNumber: string,
    estimatedDelivery?: Date
  ) {
    return this.prisma.physicalWithdrawalDetails.update({
      where: { transactionId },
      data: {
        trackingNumber,
        estimatedDelivery,
      },
    });
  }

  /**
   * Mark as delivered (for admin/fulfillment partner)
   */
  async markAsDelivered(transactionId: string) {
    await this.prisma.$transaction(async (tx) => {
      // Update withdrawal details
      await tx.physicalWithdrawalDetails.update({
        where: { transactionId },
        data: {
          actualDelivery: new Date(),
        },
      });

      // Update transaction status
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    });

    return { success: true, message: 'Marked as delivered' };
  }

  /**
   * Get all pending physical withdrawals (admin view)
   */
  async getPendingWithdrawals() {
    return this.prisma.physicalWithdrawalDetails.findMany({
      where: {
        transaction: {
          status: 'PENDING',
        },
      },
      include: {
        transaction: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
