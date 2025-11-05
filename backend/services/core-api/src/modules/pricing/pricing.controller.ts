import { Controller, Get, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { PricingService } from './pricing.service';
import { PriceQuoteDto } from './dto/price-quote.dto';
import { PriceSnapshotDto } from './dto/responses/price-snapshot.dto';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('current')
  async current(): Promise<PriceQuoteDto> {
    const quote = await this.pricingService.getEffectiveQuote();
    return plainToInstance(PriceQuoteDto, quote, { excludeExtraneousValues: true });
  }

  @Get('snapshots')
  async snapshots(@Query('limit') limit = '50'): Promise<PriceSnapshotDto[]> {
    const parsedLimit = Number(limit) || 50;
    const snapshots = await this.pricingService.listSnapshots(parsedLimit);
    return snapshots.map((snapshot) =>
      plainToInstance(PriceSnapshotDto, {
        ...snapshot,
        buyPrice: snapshot.buyPrice.toString(),
        sellPrice: snapshot.sellPrice.toString(),
      }, { excludeExtraneousValues: true }),
    );
  }
}

