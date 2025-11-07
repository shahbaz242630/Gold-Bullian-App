import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma, WalletType, TransactionType } from '@prisma/client';

import { PricingService } from '../../pricing/pricing.service';
import { BuyGoldDto } from '../dto/buy-gold.dto';
import { TransactionsOrchestratorService, RecordTransactionResult } from './transactions-orchestrator.service';
import { GoldValidationUtil } from '../../../common/utils/gold-validation.util';

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

    // Calculate gold grams
    let goldGramsValue: number;
    if (hasGrams) {
      goldGramsValue = dto.goldGrams!;
    } else {
      // Calculate from fiat amount, then round to valid 0.1g multiple
      goldGramsValue = GoldValidationUtil.calculateValidGramsFromFiat(
        dto.fiatAmount!,
        Number(pricePerGram)
      );
    }

    // Validate that gold amount is in multiples of 0.1 grams
    try {
      GoldValidationUtil.validateGoldAmount(goldGramsValue);
    } catch (error) {
      const [lower, higher] = GoldValidationUtil.getSuggestedValidAmounts(goldGramsValue);
      throw new BadRequestException(
        `${error.message}. Suggested valid amounts: ${lower}g or ${higher}g`
      );
    }

    const goldGramsDecimal = new Prisma.Decimal(goldGramsValue);
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
