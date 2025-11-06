import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma, WalletType, TransactionType } from '@prisma/client';

import { PricingService } from '../../pricing/pricing.service';
import { BuyGoldDto } from '../dto/buy-gold.dto';
import { TransactionsOrchestratorService, RecordTransactionResult } from './transactions-orchestrator.service';

@Injectable()
export class BuyGoldService {
  constructor(
    private readonly pricingService: PricingService,
    private readonly orchestrator: TransactionsOrchestratorService,
  ) {}

  async execute(dto: BuyGoldDto): Promise<RecordTransactionResult> {
    const quote = await this.pricingService.getEffectiveQuote();

    if (dto.goldGrams === undefined && dto.fiatAmount === undefined) {
      throw new BadRequestException('Either goldGrams or fiatAmount must be provided for buy transactions.');
    }

    const pricePerGram = new Prisma.Decimal(quote.buyPrice);
    const feeAmount = new Prisma.Decimal(dto.feeAmount ?? 0);

    const hasGrams = dto.goldGrams !== undefined;
    const goldGramsDecimal = hasGrams
      ? new Prisma.Decimal(dto.goldGrams!)
      : new Prisma.Decimal(dto.fiatAmount!).div(pricePerGram);
    const fiatAmountDecimal = hasGrams
      ? goldGramsDecimal.mul(pricePerGram)
      : new Prisma.Decimal(dto.fiatAmount!);

    const result = await this.orchestrator.record({
      userId: dto.userId,
      walletType: WalletType.GOLD,
      type: TransactionType.BUY,
      goldGrams: Number(goldGramsDecimal.toFixed(8)),
      fiatAmount: this.toNumber(fiatAmountDecimal, 2),
      feeAmount: this.toNumber(feeAmount, 2),
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
