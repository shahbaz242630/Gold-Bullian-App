import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

import { StripeSubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { StripeService } from '../../../integrations/stripe/stripe.service';
import { StripeErrorHandlerService } from './stripe-error-handler.service';

/**
 * Stripe Subscription Service
 *
 * Manages Stripe subscriptions for recurring payments
 *
 * Features:
 * - Create subscriptions
 * - Cancel subscriptions
 * - Pause/resume subscriptions
 * - Update subscription
 * - Link with RecurringSavingsPlan
 *
 * Integration with Recurring Plans:
 * - When user creates recurring plan, create Stripe subscription
 * - Webhook updates subscription status
 * - Automatic payment via saved payment method
 */
@Injectable()
export class StripeSubscriptionService {
  private readonly logger = new Logger(StripeSubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly errorHandler: StripeErrorHandlerService,
  ) {}

  /**
   * Create a subscription
   *
   * @param params - Subscription parameters
   * @returns Created subscription
   */
  async createSubscription(params: {
    stripeCustomerId: string;
    userId: string;
    priceId: string;
    recurringPlanId?: string;
    paymentMethodId?: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    try {
      const stripe = this.stripeService.getClient();

      // Create subscription in Stripe
      const subscription = await stripe.subscriptions.create({
        customer: params.stripeCustomerId,
        items: [{ price: params.priceId }],
        default_payment_method: params.paymentMethodId,
        trial_period_days: params.trialPeriodDays,
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: params.userId,
          recurringPlanId: params.recurringPlanId || '',
          platform: 'bulliun',
          ...params.metadata,
        },
      });

      // Save to database
      await this.prisma.stripeSubscription.create({
        data: {
          stripeCustomerId: params.stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          userId: params.userId,
          recurringPlanId: params.recurringPlanId,
          priceId: params.priceId,
          status: this.mapSubscriptionStatus(subscription.status),
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          metadata: params.metadata,
        },
      });

      this.logger.log(`Created subscription: ${subscription.id} for customer ${params.stripeCustomerId}`);
      return subscription;
    } catch (error) {
      this.errorHandler.handleError(error, 'createSubscription');
    }
  }

  /**
   * Cancel a subscription
   *
   * @param subscriptionId - Subscription ID
   * @param cancelAtPeriodEnd - Cancel at period end (true) or immediately (false)
   * @returns Cancelled subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true,
  ): Promise<Stripe.Subscription> {
    try {
      const stripe = this.stripeService.getClient();

      let subscription: Stripe.Subscription;

      if (cancelAtPeriodEnd) {
        // Cancel at period end
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        // Cancel immediately
        subscription = await stripe.subscriptions.cancel(subscriptionId);
      }

      // Update database
      await this.prisma.stripeSubscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: this.mapSubscriptionStatus(subscription.status),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
      });

      this.logger.log(`Cancelled subscription: ${subscriptionId}, at period end: ${cancelAtPeriodEnd}`);
      return subscription;
    } catch (error) {
      this.errorHandler.handleError(error, 'cancelSubscription');
    }
  }

  /**
   * Resume a cancelled subscription
   *
   * @param subscriptionId - Subscription ID
   * @returns Resumed subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const stripe = this.stripeService.getClient();

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      // Update database
      await this.prisma.stripeSubscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: this.mapSubscriptionStatus(subscription.status),
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
      });

      this.logger.log(`Resumed subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.errorHandler.handleError(error, 'resumeSubscription');
    }
  }

  /**
   * Pause a subscription
   *
   * @param subscriptionId - Subscription ID
   * @returns Paused subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const stripe = this.stripeService.getClient();

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: {
          behavior: 'void', // Don't collect payment, but keep subscription active
        },
      });

      // Update database
      await this.prisma.stripeSubscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: 'PAUSED',
        },
      });

      this.logger.log(`Paused subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.errorHandler.handleError(error, 'pauseSubscription');
    }
  }

  /**
   * Unpause a subscription
   *
   * @param subscriptionId - Subscription ID
   * @returns Unpaused subscription
   */
  async unpauseSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const stripe = this.stripeService.getClient();

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: null as any,
      });

      // Update database
      await this.prisma.stripeSubscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: this.mapSubscriptionStatus(subscription.status),
        },
      });

      this.logger.log(`Unpaused subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.errorHandler.handleError(error, 'unpauseSubscription');
    }
  }

  /**
   * Get subscription by ID
   *
   * @param subscriptionId - Subscription ID
   * @returns Subscription
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const stripe = this.stripeService.getClient();
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      this.errorHandler.handleError(error, 'getSubscription');
    }
  }

  /**
   * Update subscription status in database
   *
   * @param subscriptionId - Subscription ID
   * @param status - New status
   */
  async updateSubscriptionStatus(subscriptionId: string, status: string): Promise<void> {
    await this.prisma.stripeSubscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: this.mapSubscriptionStatus(status),
      },
    });
  }

  /**
   * Map Stripe subscription status to database status
   *
   * @param stripeStatus - Stripe status
   * @returns Database status
   */
  private mapSubscriptionStatus(stripeStatus: string): StripeSubscriptionStatus {
    const statusMap: Record<string, string> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      unpaid: 'UNPAID',
      canceled: 'CANCELED',
      incomplete: 'INCOMPLETE',
      incomplete_expired: 'INCOMPLETE_EXPIRED',
      trialing: 'TRIALING',
      paused: 'PAUSED',
    };

    return (statusMap[stripeStatus] || 'ACTIVE') as StripeSubscriptionStatus;
  }
}
