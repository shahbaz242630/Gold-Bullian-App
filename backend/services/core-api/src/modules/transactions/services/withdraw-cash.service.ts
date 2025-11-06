import { Injectable } from '@nestjs/common';
import { WalletType, TransactionType } from '@prisma/client';

import { WithdrawCashDto } from '../dto/withdraw-cash.dto';
import { TransactionsOrchestratorService, RecordTransactionResult } from './transactions-orchestrator.service';

@Injectable()
export class WithdrawCashService {
  constructor(private readonly orchestrator: TransactionsOrchestratorService) {}

  async execute(dto: WithdrawCashDto): Promise<RecordTransactionResult> {
    const result = await this.orchestrator.record({
      userId: dto.userId,
      walletType: WalletType.GOLD,
      type: TransactionType.WITHDRAW_CASH,
      goldGrams: dto.goldGrams,
      fiatAmount: dto.fiatAmount,
      feeAmount: dto.feeAmount ?? 0,
      fiatCurrency: dto.currency,
      metadata: dto.metadata,
    });

    return result;
  }
}
