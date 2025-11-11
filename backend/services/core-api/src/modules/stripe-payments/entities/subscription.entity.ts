/**
 * Subscription Entity
 *
 * Response entity for subscription data
 */
export class SubscriptionEntity {
  id!: string;
  status!: string;
  priceId?: string;
  currentPeriodStart!: Date;
  currentPeriodEnd!: Date;
  cancelAtPeriodEnd!: boolean;
  canceledAt?: Date;
  createdAt!: Date;

  constructor(partial: Partial<SubscriptionEntity>) {
    Object.assign(this, partial);
  }
}
