import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpsertNomineeDto {
  @IsString()
  userId!: string;

  @IsString()
  fullName!: string;

  @IsString()
  relationship!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? value.toUpperCase() : value))
  @Length(2, 3)
  countryCode?: string;

  @IsOptional()
  documents?: Record<string, unknown>;
}

