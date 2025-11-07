import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsEnum, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { RecurringPlanFrequency } from '@prisma/client';

export class CreateRecurringPlanDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  goalName?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  goalAmountAED?: number;

  @IsDateString()
  @IsOptional()
  goalDate?: string; // ISO date string

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10) // Minimum recurring amount 10 AED
  @Type(() => Number)
  recurringAmountAED: number;

  @IsEnum(RecurringPlanFrequency)
  frequency: RecurringPlanFrequency; // DAILY, WEEKLY, MONTHLY, YEARLY

  @IsInt()
  @Min(1)
  executionDay: number; // Day of month (1-31) for MONTHLY, day of week (1-7) for WEEKLY

  @IsDateString()
  startDate: string; // ISO date string

  @IsString()
  @IsOptional()
  cardToken?: string; // Tokenized card for auto-debit

  @IsOptional()
  metadata?: Record<string, any>;
}
