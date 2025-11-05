import { Expose } from 'class-transformer';

export class PriceQuoteDto {
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
  isOverride!: boolean;

  @Expose()
  overrideReason?: string | null;
}

