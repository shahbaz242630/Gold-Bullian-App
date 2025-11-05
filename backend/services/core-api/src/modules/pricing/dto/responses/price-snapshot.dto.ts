import { Expose } from 'class-transformer';

export class PriceSnapshotDto {
  @Expose()
  id!: string;

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
  createdAt!: Date;
}

