import { Injectable } from '@nestjs/common';

import { BuyGoldDto } from './dto/buy-gold.dto';
import { SellGoldDto } from './dto/sell-gold.dto';
import { WithdrawCashDto } from './dto/withdraw-cash.dto';
import { WithdrawPhysicalDto } from './dto/withdraw-physical.dto';
import { BuyGoldService } from './services/buy-gold.service';
import { SellGoldService } from './services/sell-gold.service';
import { WithdrawCashService } from './services/withdraw-cash.service';
import { WithdrawPhysicalService } from './services/withdraw-physical.service';
import { TransactionsOrchestratorService, RecordTransactionResult } from './services/transactions-orchestrator.service';

/**
 * Main TransactionsService - delegates to specialized services
 * This facade pattern keeps the API stable while enabling better internal organization
 */
@Injectable()
export class TransactionsService {
  constructor(
    private readonly orchestrator: TransactionsOrchestratorService,
    private readonly buyGoldService: BuyGoldService,
    private readonly sellGoldService: SellGoldService,
    private readonly withdrawCashService: WithdrawCashService,
    private readonly withdrawPhysicalService: WithdrawPhysicalService,
  ) {}

  async listByUser(userId: string, limit = 50, cursor?: string) {
    return this.orchestrator.listByUser(userId, limit, cursor);
  }

  async buyGold(dto: BuyGoldDto): Promise<RecordTransactionResult> {
    return this.buyGoldService.execute(dto);
  }

  async sellGold(dto: SellGoldDto): Promise<RecordTransactionResult> {
    return this.sellGoldService.execute(dto);
  }

  async withdrawCash(dto: WithdrawCashDto): Promise<RecordTransactionResult> {
    return this.withdrawCashService.execute(dto);
  }

  async withdrawPhysical(dto: WithdrawPhysicalDto): Promise<RecordTransactionResult> {
    return this.withdrawPhysicalService.execute(dto);
  }
}
