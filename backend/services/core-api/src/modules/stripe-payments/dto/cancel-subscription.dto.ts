import { IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * DTO for canceling a subscription
 */
export class CancelSubscriptionDto {
  @IsString()
  subscriptionId!: string;

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;
}
