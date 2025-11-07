import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateKidAccountDto } from '../dto/create-kid-account.dto';
import { KidAccountEntity } from '../entities/kid-account.entity';
import { KidsWalletValidationService } from './kids-wallet-validation.service';

/**
 * Kids Wallet Creation Service
 *
 * Handles creating kid accounts and their wallets
 * Single Responsibility: Kid account creation
 */
@Injectable()
export class KidsWalletCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: KidsWalletValidationService,
  ) {}

  /**
   * Create a kid account
   * - Creates user record with isKidsAccount=true and parentUserId set
   * - Creates gold wallet for the kid
   * - Optionally transfers initial funding from parent
   */
  async createKidAccount(dto: CreateKidAccountDto): Promise<KidAccountEntity> {
    // Validate parent user
    await this.validationService.validateParentUser(dto.parentUserId);

    // Validate age
    this.validationService.validateAge(new Date(dto.dateOfBirth));

    // If initial funding, validate it
    if (dto.initialFundingGrams) {
      this.validationService.validateGoldAmount(dto.initialFundingGrams);
      await this.validationService.validateParentBalance(
        dto.parentUserId,
        dto.initialFundingGrams
      );
    }

    // Create kid account in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user record for kid
      // Note: Supabase authentication would be handled separately
      // For now, we create a placeholder supabaseUid
      const kid = await tx.user.create({
        data: {
          supabaseUid: `kid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          countryCode: dto.countryCode,
          dateOfBirth: new Date(dto.dateOfBirth),
          parentUserId: dto.parentUserId,
          isKidsAccount: true,
          kycStatus: 'PENDING', // Kid will need own KYC
        },
      });

      // Create gold wallet for kid
      await tx.wallet.create({
        data: {
          userId: kid.id,
          type: 'GOLD',
          balanceGrams: new Prisma.Decimal(dto.initialFundingGrams || 0),
          lockedGrams: new Prisma.Decimal(0),
        },
      });

      // If initial funding, deduct from parent's wallet
      if (dto.initialFundingGrams && dto.initialFundingGrams > 0) {
        await tx.wallet.update({
          where: {
            userId_type: {
              userId: dto.parentUserId,
              type: 'GOLD',
            },
          },
          data: {
            balanceGrams: {
              decrement: new Prisma.Decimal(dto.initialFundingGrams),
            },
          },
        });

        // Create transaction record for the transfer
        await tx.transaction.create({
          data: {
            userId: dto.parentUserId,
            walletId: (await tx.wallet.findUnique({
              where: { userId_type: { userId: dto.parentUserId, type: 'GOLD' } },
            }))!.id,
            type: 'ADJUSTMENT',
            status: 'COMPLETED',
            goldGrams: new Prisma.Decimal(-dto.initialFundingGrams),
            fiatAmount: new Prisma.Decimal(0),
            fiatCurrency: 'AED',
            referenceCode: `TRANSFER_TO_KID_${kid.id}_${Date.now()}`,
            metadata: {
              type: 'parent_to_kid_transfer',
              kidUserId: kid.id,
              note: 'Initial funding for kid account',
            } as Prisma.InputJsonValue,
            completedAt: new Date(),
          },
        });
      }

      return kid;
    });

    return KidAccountEntity.fromModel(result);
  }
}
