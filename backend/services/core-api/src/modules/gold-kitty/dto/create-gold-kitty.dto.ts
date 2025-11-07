import { IsString, IsNumber, IsOptional, IsDateString, Min, Max, IsInt } from 'class-validator';

export class CreateGoldKittyDto {
  @IsString()
  userId!: string; // Owner

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(10) // Minimum 10 AED per month
  monthlyAmountAED!: number;

  @IsInt()
  @Min(1)
  @Max(31)
  contributionDay!: number; // Day of month (1-31)

  @IsDateString()
  startDate!: string;

  @IsInt()
  @Min(2) // At least 2 rounds for group kitty
  totalRounds!: number;

  @IsOptional()
  memberUserIds?: string[]; // Initial members to invite
}
