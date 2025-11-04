import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString, Length, Min } from 'class-validator';

export class BuyGoldDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  goldGrams?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fiatAmount?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  feeAmount?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  validate() {
    if (this.goldGrams === undefined && this.fiatAmount === undefined) {
      throw new Error('Either goldGrams or fiatAmount must be provided.');
    }
  }
}

