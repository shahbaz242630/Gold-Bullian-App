import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users/users.module';
import { PricingModule } from '../pricing/pricing.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { BuyGoldService } from './services/buy-gold.service';
import { SellGoldService } from './services/sell-gold.service';
import { WithdrawCashService } from './services/withdraw-cash.service';
import { WithdrawPhysicalService } from './services/withdraw-physical.service';
import { TransactionsOrchestratorService } from './services/transactions-orchestrator.service';

@Module({
  imports: [DatabaseModule, PricingModule, UsersModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionsOrchestratorService,
    BuyGoldService,
    SellGoldService,
    WithdrawCashService,
    WithdrawPhysicalService,
  ],
  exports: [TransactionsService],
})
export class TransactionsModule {}
