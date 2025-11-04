import { Transform } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreatePriceSnapshotDto {
  @IsString()
  source!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  buyPrice!: number;

  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  sellPrice!: number;

  @IsString()
  @Length(3, 3)
  currency: string = 'AED';

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  effectiveAt?: Date;
}

