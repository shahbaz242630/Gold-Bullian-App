import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { KidsWalletsController } from './kids-wallets.controller';
import { KidsWalletsService } from './services/kids-wallets.service';
import { KidsWalletCreationService } from './services/kids-wallet-creation.service';
import { KidsWalletTransferService } from './services/kids-wallet-transfer.service';
import { KidsWalletValidationService } from './services/kids-wallet-validation.service';

/**
 * Kids Wallets Module
 *
 * Enterprise-level modular architecture for Kids Wallets (Family Accounts)
 *
 * Features:
 * - Create sub-accounts for children
 * - Each kid has own KYC documents
 * - Each kid is their own nominee
 * - Parent can view all kids' balances (Family Dashboard)
 * - Parent can transfer gold to kids
 * - Age validation (under 18 only)
 * - Parent-child relationship tracking
 * - Transfer history
 *
 * Architecture:
 * - Specialized services with single responsibilities
 * - Clean separation of concerns
 * - Easy to test and debug
 * - Scalable and maintainable
 *
 * Business Rules:
 * - Kids must be under 18 years old
 * - Kids cannot create other kid accounts
 * - Only parent can transfer to their own kids
 * - Gold amounts follow 0.1gm multiples rule
 * - Each kid account is fully independent for KYC purposes
 */
@Module({
  imports: [DatabaseModule],
  controllers: [KidsWalletsController],
  providers: [
    // Main orchestrator
    KidsWalletsService,

    // Specialized services
    KidsWalletCreationService,
    KidsWalletTransferService,
    KidsWalletValidationService,
  ],
  exports: [KidsWalletsService],
})
export class KidsWalletsModule {}
