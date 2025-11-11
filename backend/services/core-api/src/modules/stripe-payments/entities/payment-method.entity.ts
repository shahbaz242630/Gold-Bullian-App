/**
 * Payment Method Entity
 *
 * Response entity for payment method data
 */
export class PaymentMethodEntity {
  id!: string;
  type!: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  isDefault!: boolean;
  createdAt!: Date;

  constructor(partial: Partial<PaymentMethodEntity>) {
    Object.assign(this, partial);
  }
}
