import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString, Length, Min, IsNumber } from 'class-validator';

export class UpsertPriceOverrideDto {
  @IsString()
  adminId!: string;

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
  @IsString()
  reason?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  expiresAt?: Date;
}

