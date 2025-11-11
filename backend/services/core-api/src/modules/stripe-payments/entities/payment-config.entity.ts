/**
 * Payment Config Entity
 *
 * Response entity for Stripe configuration
 */
export class PaymentConfigEntity {
  isAvailable: boolean;
  publishableKey: string | null;

  constructor(partial: Partial<PaymentConfigEntity>) {
    Object.assign(this, partial);
  }
}
