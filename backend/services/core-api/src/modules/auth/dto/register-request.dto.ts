import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';

export class RegisterRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(12, 128)
  password!: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  lastName?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @Length(2, 3)
  countryCode?: string;

  @IsBoolean()
  acceptedTerms!: boolean;
}

