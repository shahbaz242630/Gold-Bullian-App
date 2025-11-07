import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users/users.module';
import { PricingModule } from '../pricing/pricing.module';
import { TransactionsController } from './transactions.controller';
import { PhysicalWithdrawalController } from './physical-withdrawal.controller';
import { TransactionsService } from './transactions.service';
import { PhysicalWithdrawalService } from './services/physical-withdrawal.service';
import { PhysicalWithdrawalValidationService } from './services/physical-withdrawal-validation.service';

/**
 * Transactions Module (Enhanced)
 *
 * Includes enhanced physical withdrawal functionality with:
 * - Coin size selection (1g, 5g, 10g, 20g, 50g, 100g)
 * - Delivery method options (Home, Partner Pickup, Vault Pickup)
 * - Recipient details and addresses
 * - Delivery tracking
 * - Admin fulfillment management
 */
@Module({
  imports: [DatabaseModule, PricingModule, UsersModule],
  controllers: [TransactionsController, PhysicalWithdrawalController],
  providers: [
    TransactionsService,
    PhysicalWithdrawalService,
    PhysicalWithdrawalValidationService,
  ],
  exports: [TransactionsService, PhysicalWithdrawalService],
})
export class TransactionsModule {}
