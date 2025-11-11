import { IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * DTO for attaching a payment method
 */
export class AttachPaymentMethodDto {
  @IsString()
  paymentMethodId!: string;

  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean;
}
