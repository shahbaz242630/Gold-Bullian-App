import { Injectable } from '@nestjs/common';
import { Prisma, WalletType, TransactionType } from '@prisma/client';

import { PricingService } from '../../pricing/pricing.service';
import { SellGoldDto } from '../dto/sell-gold.dto';
import { TransactionsOrchestratorService, RecordTransactionResult } from './transactions-orchestrator.service';

@Injectable()
export class SellGoldService {
  constructor(
    private readonly pricingService: PricingService,
    private readonly orchestrator: TransactionsOrchestratorService,
  ) {}

  async execute(dto: SellGoldDto): Promise<RecordTransactionResult> {
    const quote = await this.pricingService.getEffectiveQuote();
    const pricePerGram = new Prisma.Decimal(quote.sellPrice);

    const goldGramsDecimal = new Prisma.Decimal(dto.goldGrams);
    const feeAmountDecimal = new Prisma.Decimal(dto.feeAmount ?? 0);
    const fiatAmountDecimal = goldGramsDecimal.mul(pricePerGram);

    const result = await this.orchestrator.record({
      userId: dto.userId,
      walletType: WalletType.GOLD,
      type: TransactionType.SELL,
      goldGrams: Number(goldGramsDecimal.toFixed(8)),
      fiatAmount: this.toNumber(fiatAmountDecimal, 2),
      feeAmount: this.toNumber(feeAmountDecimal, 2),
      fiatCurrency: dto.currency ?? quote.currency,
      metadata: {
        priceSource: quote.source,
        pricePerGram: pricePerGram.toString(),
      },
    });

    return result;
  }

  private toNumber(decimal: Prisma.Decimal, precision: number) {
    return Number(decimal.toFixed(precision));
  }
}
