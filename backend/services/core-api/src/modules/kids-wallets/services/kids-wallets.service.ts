import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateKidAccountDto } from '../dto/create-kid-account.dto';
import { UpdateKidAccountDto } from '../dto/update-kid-account.dto';
import { TransferToKidDto } from '../dto/transfer-to-kid.dto';
import { KidAccountEntity } from '../entities/kid-account.entity';
import { FamilyDashboardEntity } from '../entities/family-dashboard.entity';
import { KidsWalletCreationService } from './kids-wallet-creation.service';
import { KidsWalletTransferService } from './kids-wallet-transfer.service';
import { KidsWalletValidationService } from './kids-wallet-validation.service';

/**
 * Kids Wallets Service (Main Orchestrator)
 *
 * Coordinates all kids wallet operations by delegating to specialized services
 * Single Responsibility: Orchestration and high-level queries
 */
@Injectable()
export class KidsWalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creationService: KidsWalletCreationService,
    private readonly transferService: KidsWalletTransferService,
    private readonly validationService: KidsWalletValidationService,
  ) {}

  // ==================== Kid Account Management ====================

  /**
   * Create a kid account
   */
  async createKidAccount(dto: CreateKidAccountDto) {
    return this.creationService.createKidAccount(dto);
  }

  /**
   * Get all kid accounts for a parent
   */
  async getKidAccounts(parentUserId: string): Promise<KidAccountEntity[]> {
    const kids = await this.prisma.user.findMany({
      where: {
        parentUserId,
        isKidsAccount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return kids.map(KidAccountEntity.fromModel);
  }

  /**
   * Get a specific kid account
   */
  async getKidAccount(kidUserId: string): Promise<KidAccountEntity> {
    const kid = await this.prisma.user.findUnique({
      where: { id: kidUserId },
    });

    if (!kid || !kid.isKidsAccount) {
      throw new NotFoundException(`Kid account ${kidUserId} not found`);
    }

    return KidAccountEntity.fromModel(kid);
  }

  /**
   * Update kid account details
   */
  async updateKidAccount(
    kidUserId: string,
    dto: UpdateKidAccountDto
  ): Promise<KidAccountEntity> {
    const kid = await this.prisma.user.update({
      where: { id: kidUserId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        countryCode: dto.countryCode,
      },
    });

    return KidAccountEntity.fromModel(kid);
  }

  // ==================== Family Dashboard ====================

  /**
   * Get family dashboard (parent + all kids with balances)
   */
  async getFamilyDashboard(parentUserId: string): Promise<FamilyDashboardEntity> {
    // Validate parent
    await this.validationService.validateParentUser(parentUserId);

    // Get parent info and wallet
    const parent = await this.prisma.user.findUnique({
      where: { id: parentUserId },
      include: {
        wallets: {
          where: { type: 'GOLD' },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    // Get all kids with their wallets
    const kids = await this.prisma.user.findMany({
      where: {
        parentUserId,
        isKidsAccount: true,
      },
      include: {
        wallets: {
          where: { type: 'GOLD' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate totals
    const parentBalance = Number(parent.wallets[0]?.balanceGrams || 0);
    const kidsBalances = kids.map((k) => Number(k.wallets[0]?.balanceGrams || 0));
    const totalFamilyGoldGrams = parentBalance + kidsBalances.reduce((sum, b) => sum + b, 0);

    // TODO: Get current gold price to calculate AED value
    const currentGoldPriceAED = 200; // Mock price per gram
    const totalFamilyValueAED = totalFamilyGoldGrams * currentGoldPriceAED;

    const dashboard: FamilyDashboardEntity = {
      parentAccount: {
        id: parent.id,
        fullName: `${parent.firstName || ''} ${parent.lastName || ''}`.trim(),
        balanceGrams: parentBalance,
      },
      kidAccounts: kids.map((kid) => {
        const age = kid.dateOfBirth
          ? new Date().getFullYear() - new Date(kid.dateOfBirth).getFullYear()
          : null;

        return {
          id: kid.id,
          fullName: `${kid.firstName || ''} ${kid.lastName || ''}`.trim(),
          age,
          balanceGrams: Number(kid.wallets[0]?.balanceGrams || 0),
          kycStatus: kid.kycStatus,
        };
      }),
      totalFamilyGoldGrams,
      totalFamilyValueAED,
      numberOfKids: kids.length,
    };

    return dashboard;
  }

  // ==================== Transfers ====================

  /**
   * Transfer gold from parent to kid
   */
  async transferToKid(dto: TransferToKidDto) {
    return this.transferService.transferToKid(dto);
  }

  /**
   * Get transfer history between parent and kid
   */
  async getTransferHistory(parentUserId: string, kidUserId: string) {
    return this.transferService.getTransferHistory(parentUserId, kidUserId);
  }
}
