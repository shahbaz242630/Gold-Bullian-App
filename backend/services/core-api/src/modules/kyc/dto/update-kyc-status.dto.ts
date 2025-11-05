import { IsOptional, IsString } from 'class-validator';
import { KycStatus } from '@prisma/client';

export class UpdateKycStatusDto {
  @IsString()
  userId!: string;

  @IsString()
  status!: KycStatus;

  @IsOptional()
  @IsString()
  reviewerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

