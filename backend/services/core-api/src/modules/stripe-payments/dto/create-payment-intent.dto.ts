import { IsNumber, IsOptional, IsString, Min, IsObject } from 'class-validator';

/**
 * DTO for creating a payment intent
 */
export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(1, 'Amount must be at least 1 AED')
  amountAED: number;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
