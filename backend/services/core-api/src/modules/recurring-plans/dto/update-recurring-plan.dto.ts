import { IsString, IsOptional, IsNumber, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { RecurringPlanFrequency, RecurringPlanStatus } from '@prisma/client';

export class UpdateRecurringPlanDto {
  @IsString()
  @IsOptional()
  name?: string;

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
  goalDate?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(10)
  @Type(() => Number)
  recurringAmountAED?: number;

  @IsEnum(RecurringPlanFrequency)
  @IsOptional()
  frequency?: RecurringPlanFrequency;

  @IsInt()
  @IsOptional()
  @Min(1)
  executionDay?: number;

  @IsString()
  @IsOptional()
  cardToken?: string;

  @IsEnum(RecurringPlanStatus)
  @IsOptional()
  status?: RecurringPlanStatus;

  @IsOptional()
  metadata?: Record<string, any>;
}
