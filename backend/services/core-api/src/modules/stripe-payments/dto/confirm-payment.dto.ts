import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for confirming a payment intent
 */
export class ConfirmPaymentDto {
  @IsString()
  paymentIntentId!: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
