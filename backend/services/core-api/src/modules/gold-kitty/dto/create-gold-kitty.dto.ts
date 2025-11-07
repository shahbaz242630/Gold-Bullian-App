import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGoldKittyDto {
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10) // Minimum monthly amount 10 AED
  @Type(() => Number)
  monthlyAmountAED: number;

  @IsInt()
  @Min(1)
  @Max(31)
  contributionDay: number; // Day of month (1-31)

  @IsDateString()
  startDate: string; // ISO date string

  @IsInt()
  @Min(2) // At least 2 members (including owner)
  @Max(12) // Maximum 12 rounds/members
  totalRounds: number;

  @IsOptional()
  metadata?: Record<string, any>;
}
