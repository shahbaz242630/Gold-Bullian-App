import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * DTO for refunding a payment
 */
export class RefundPaymentDto {
  @IsString()
  paymentIntentId: string;

  @IsOptional()
  @IsEnum(['duplicate', 'fraudulent', 'requested_by_customer'])
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}
