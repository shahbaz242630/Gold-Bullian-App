import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class WithdrawCashDto {
  @IsString()
  userId!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  goldGrams!: number;

  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fiatAmount!: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  feeAmount?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency: string = 'AED';

  @IsOptional()
  metadata?: Record<string, unknown>;
}

