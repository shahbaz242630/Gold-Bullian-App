import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateKidAccountDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  countryCode?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
