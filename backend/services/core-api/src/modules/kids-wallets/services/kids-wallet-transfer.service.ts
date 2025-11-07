import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { TransferToKidDto } from '../dto/transfer-to-kid.dto';
import { KidsWalletValidationService } from './kids-wallet-validation.service';

/**
 * Kids Wallet Transfer Service
 *
 * Handles gold transfers from parent to kid accounts
 * Single Responsibility: Parent-to-kid transfers
 */
@Injectable()
export class KidsWalletTransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: KidsWalletValidationService,
  ) {}

  /**
   * Transfer gold from parent to kid
   */
  async transferToKid(dto: TransferToKidDto): Promise<{
    transactionId: string;
    parentBalanceAfter: number;
    kidBalanceAfter: number;
  }> {
    // Validate relationship
    await this.validationService.validateParentChildRelationship(
      dto.parentUserId,
      dto.kidUserId
    );

    // Validate gold amount
    this.validationService.validateGoldAmount(dto.goldGrams);

    // Validate parent balance
    await this.validationService.validateParentBalance(dto.parentUserId, dto.goldGrams);

    // Execute transfer in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct from parent
      const parentWallet = await tx.wallet.update({
        where: {
          userId_type: {
            userId: dto.parentUserId,
            type: 'GOLD',
          },
        },
        data: {
          balanceGrams: {
            decrement: new Prisma.Decimal(dto.goldGrams),
          },
        },
      });

      // Add to kid
      const kidWallet = await tx.wallet.update({
        where: {
          userId_type: {
            userId: dto.kidUserId,
            type: 'GOLD',
          },
        },
        data: {
          balanceGrams: {
            increment: new Prisma.Decimal(dto.goldGrams),
          },
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: dto.parentUserId,
          walletId: parentWallet.id,
          type: 'ADJUSTMENT',
          status: 'COMPLETED',
          goldGrams: new Prisma.Decimal(-dto.goldGrams),
          fiatAmount: new Prisma.Decimal(0),
          fiatCurrency: 'AED',
          referenceCode: `TRANSFER_${dto.parentUserId}_TO_${dto.kidUserId}_${Date.now()}`,
          metadata: {
            type: 'parent_to_kid_transfer',
            kidUserId: dto.kidUserId,
            note: dto.note || 'Transfer to kid account',
          } as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      return {
        transactionId: transaction.id,
        parentBalanceAfter: Number(parentWallet.balanceGrams),
        kidBalanceAfter: Number(kidWallet.balanceGrams),
      };
    });

    return result;
  }

  /**
   * Get transfer history between parent and kid
   */
  async getTransferHistory(parentUserId: string, kidUserId: string) {
    // Validate relationship
    await this.validationService.validateParentChildRelationship(
      parentUserId,
      kidUserId
    );

    const transfers = await this.prisma.transaction.findMany({
      where: {
        userId: parentUserId,
        type: 'ADJUSTMENT',
        metadata: {
          path: ['kidUserId'],
          equals: kidUserId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return transfers.map((t) => ({
      id: t.id,
      goldGrams: Math.abs(Number(t.goldGrams)),
      createdAt: t.createdAt,
      note: (t.metadata as any)?.note || '',
    }));
  }
}
