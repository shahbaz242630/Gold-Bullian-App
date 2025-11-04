import { Expose } from 'class-transformer';

export class PriceQuoteEntity {
  @Expose()
  source!: string;

  @Expose()
  buyPrice!: string;

  @Expose()
  sellPrice!: string;

  @Expose()
  currency!: string;

  @Expose()
  effectiveAt!: Date;

  @Expose()
  overrideReason?: string | null;

  @Expose()
  isOverride!: boolean;

  static create(params: {
    source: string;
    buyPrice: string;
    sellPrice: string;
    currency: string;
    effectiveAt: Date;
    overrideReason?: string | null;
    isOverride: boolean;
  }): PriceQuoteEntity {
    const entity = new PriceQuoteEntity();
    entity.source = params.source;
    entity.buyPrice = params.buyPrice;
    entity.sellPrice = params.sellPrice;
    entity.currency = params.currency;
    entity.effectiveAt = params.effectiveAt;
    entity.overrideReason = params.overrideReason ?? null;
    entity.isOverride = params.isOverride;
    return entity;
  }
}

