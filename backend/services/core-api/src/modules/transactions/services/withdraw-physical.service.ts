import { Injectable } from '@nestjs/common';
import { WalletType, TransactionType } from '@prisma/client';

import { WithdrawPhysicalDto } from '../dto/withdraw-physical.dto';
import { TransactionsOrchestratorService, RecordTransactionResult } from './transactions-orchestrator.service';

@Injectable()
export class WithdrawPhysicalService {
  constructor(private readonly orchestrator: TransactionsOrchestratorService) {}

  async execute(dto: WithdrawPhysicalDto): Promise<RecordTransactionResult> {
    const result = await this.orchestrator.record({
      userId: dto.userId,
      walletType: WalletType.GOLD,
      type: TransactionType.WITHDRAW_PHYSICAL,
      goldGrams: dto.goldGrams,
      fiatAmount: dto.valuationAmount ?? 0,
      feeAmount: dto.feeAmount ?? 0,
      fiatCurrency: dto.currency,
      metadata: {
        fulfillmentPartner: dto.fulfillmentPartner,
        denomination: dto.denomination,
        ...dto.metadata,
      },
    });

    return result;
  }
}
