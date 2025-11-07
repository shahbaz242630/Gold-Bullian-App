import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEmail, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKidAccountDto {
  @IsString()
  @IsNotEmpty()
  parentUserId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsOptional()
  email?: string; // Optional for young kids

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string; // ISO date string

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  countryCode?: string;

  @IsNumber({ maxDecimalPlaces: 8 })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  initialFundingGrams?: number; // Optional initial gold transfer from parent

  @IsOptional()
  metadata?: Record<string, any>; // Can store document info, etc.
}
