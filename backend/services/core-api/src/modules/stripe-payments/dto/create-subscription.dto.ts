import { IsOptional, IsString, IsObject } from 'class-validator';

/**
 * DTO for creating a subscription
 */
export class CreateSubscriptionDto {
  @IsString()
  priceId!: string;

  @IsOptional()
  @IsString()
  recurringPlanId?: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
