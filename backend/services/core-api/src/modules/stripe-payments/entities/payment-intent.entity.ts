/**
 * Payment Intent Entity
 *
 * Response entity for payment intent data
 */
export class PaymentIntentEntity {
  id!: string;
  clientSecret!: string;
  amount!: number;
  currency!: string;
  status!: string;
  paymentMethodId?: string;
  receiptUrl?: string;
  createdAt!: Date;

  constructor(partial: Partial<PaymentIntentEntity>) {
    Object.assign(this, partial);
  }
}
