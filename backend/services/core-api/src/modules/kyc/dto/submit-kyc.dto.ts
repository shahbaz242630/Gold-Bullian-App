import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  userId!: string;

  @IsString()
  provider!: string;

  @IsOptional()
  @IsString()
  providerRef?: string;

  @IsOptional()
  @Transform(({ value }) => value ?? null)
  metadata?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  notes?: string;
}

