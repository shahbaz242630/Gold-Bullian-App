import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { TransactionType, WalletType } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  userId!: string;

  @IsEnum(WalletType)
  walletType: WalletType = WalletType.GOLD;

  @IsEnum(TransactionType)
  type!: TransactionType;

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

  @IsString()
  @Length(3, 3)
  fiatCurrency: string = 'AED';

  @IsOptional()
  @IsString()
  referenceCode?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

