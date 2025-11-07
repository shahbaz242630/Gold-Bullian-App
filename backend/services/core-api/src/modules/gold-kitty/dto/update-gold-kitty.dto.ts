import { IsString, IsOptional, IsEnum } from 'class-validator';
import { GoldKittyStatus } from '@prisma/client';

export class UpdateGoldKittyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GoldKittyStatus)
  @IsOptional()
  status?: GoldKittyStatus;

  @IsOptional()
  metadata?: Record<string, any>;
}
