import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

import { PrismaService } from '../../../database/prisma.service';
import { StripeService } from '../../../integrations/stripe/stripe.service';
import { StripeCustomerService } from './stripe-customer.service';
import { StripePaymentIntentService } from './stripe-payment-intent.service';
import { StripePaymentMethodService } from './stripe-payment-method.service';
import { StripeSubscriptionService } from './stripe-subscription.service';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeValidationService } from './stripe-validation.service';
import { StripeErrorHandlerService } from './stripe-error-handler.service';

/**
 * Stripe Payments Service (Main Orchestrator)
 *
 * High-level service that coordinates all Stripe operations
 *
 * Features:
 * - Orchestrates specialized services
 * - Provides simplified API for controllers
 * - Handles complex payment flows
 * - Integrates with wallet and transaction systems
 *
 * Architecture:
 * - Delegates to specialized services
 * - Manages database transactions
 * - Ensures data consistency
 * - Provides business logic layer
 *
 * Usage:
 * ```typescript
 * // In controller
 * const payment = await this.stripePayments.purchaseGold(userId, amount);
 * ```
 */
@Injectable()
export class StripePaymentsService {
  private readonly logger = new Logger(StripePaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly customerService: StripeCustomerService,
    private readonly paymentIntentService: StripePaymentIntentService,
    private readonly paymentMethodService: StripePaymentMethodService,
    private readonly subscriptionService: StripeSubscriptionService,
    private readonly webhookService: StripeWebhookService,
    private readonly validation: StripeValidationService,
    private readonly errorHandler: StripeErrorHandlerService,
  ) {}

  /**
   * Check if Stripe is configured and available
   *
   * @returns true if Stripe is available
   */
  isAvailable(): boolean {
    return this.stripeService.isAvailable();
  }

  /**
   * Get Stripe publishable key for frontend
   *
   * @returns Publishable key or null
   */
  getPublishableKey(): string | null {
    return this.stripeService.getPublishableKey();
  }

  /**
   * Create a payment intent for gold purchase
   *
   * @param userId - User ID
   * @param amountAED - Amount in AED (decimal)
   * @param metadata - Additional metadata
   * @returns Payment intent with client secret
   */
  async createGoldPurchaseIntent(
    userId: string,
    amountAED: number,
    metadata?: Record<string, string>,
  ): Promise<{ paymentIntent: Stripe.PaymentIntent; clientSecret: string }> {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true, phoneNumber: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get or create Stripe customer
      const stripeCustomerId = await this.customerService.getOrCreateCustomer(
        userId,
        user.email || undefined,
        user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
        user.phoneNumber || undefined,
      );

      // Create payment intent (amount in fils - smallest unit)
      const amountInFils = Math.round(amountAED * 100);
      const paymentIntent = await this.paymentIntentService.createPaymentIntent({
        stripeCustomerId,
        userId,
        amount: amountInFils,
        currency: 'AED',
        description: `Gold purchase - ${amountAED} AED`,
        metadata: {
          type: 'gold_purchase',
          amountAED: amountAED.toString(),
          ...metadata,
        },
      });

      this.logger.log(`Created gold purchase intent: ${paymentIntent.id} for user ${userId}`);

      return {
        paymentIntent,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      this.errorHandler.handleError(error, 'createGoldPurchaseIntent');
    }
  }

  /**
   * Confirm payment and process gold purchase
   * (Called after client confirms payment on frontend)
   *
   * @param paymentIntentId - Payment intent ID
   * @returns Payment status
   */
  async confirmGoldPurchase(paymentIntentId: string): Promise<{
    success: boolean;
    paymentIntent: Stripe.PaymentIntent;
  }> {
    try {
      const paymentIntent = await this.paymentIntentService.getPaymentIntent(paymentIntentId);

      // Check if already succeeded
      if (paymentIntent.status === 'succeeded') {
        this.logger.debug(`Payment ${paymentIntentId} already succeeded`);
        return { success: true, paymentIntent };
      }

      // Confirm if needed (status is not 'succeeded' at this point)
      const confirmed = await this.paymentIntentService.confirmPaymentIntent(paymentIntentId);
      return { success: confirmed.status === 'succeeded', paymentIntent: confirmed };
    } catch (error) {
      this.errorHandler.handleError(error, 'confirmGoldPurchase');
    }
  }

  /**
   * Process successful payment and update wallet
   * (Called from webhook handler)
   *
   * @param paymentIntentId - Payment intent ID
   */
  async processSuccessfulPayment(paymentIntentId: string): Promise<void> {
    try {
      const payment = await this.paymentIntentService.getPaymentFromDb(paymentIntentId);

      // Skip if already processed
      if (payment.transactionId) {
        this.logger.debug(`Payment ${paymentIntentId} already linked to transaction`);
        return;
      }

      // TODO: Integrate with pricing service to convert AED to gold grams
      // TODO: Create transaction record
      // TODO: Update wallet balance
      // This will be implemented when integrating with the Transaction module

      this.logger.log(`Successfully processed payment ${paymentIntentId}`);
    } catch (error) {
      this.errorHandler.handleError(error, 'processSuccessfulPayment');
    }
  }

  /**
   * Attach payment method to customer
   *
   * @param userId - User ID
   * @param paymentMethodId - Payment method ID
   * @param setAsDefault - Set as default payment method
   * @returns Attached payment method
   */
  async attachPaymentMethod(
    userId: string,
    paymentMethodId: string,
    setAsDefault: boolean = false,
  ): Promise<Stripe.PaymentMethod> {
    try {
      const customer = await this.prisma.stripeCustomer.findUnique({
        where: { userId },
      });

      if (!customer) {
        throw new Error('Customer not found. Please create a payment first.');
      }

      return await this.paymentMethodService.attachPaymentMethod({
        paymentMethodId,
        stripeCustomerId: customer.stripeCustomerId,
        userId,
        setAsDefault,
      });
    } catch (error) {
      this.errorHandler.handleError(error, 'attachPaymentMethod');
    }
  }

  /**
   * Detach payment method from customer
   *
   * @param paymentMethodId - Payment method ID
   * @returns Detached payment method
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await this.paymentMethodService.detachPaymentMethod(paymentMethodId);
    } catch (error) {
      this.errorHandler.handleError(error, 'detachPaymentMethod');
    }
  }

  /**
   * List user's payment methods
   *
   * @param userId - User ID
   * @returns List of payment methods
   */
  async listPaymentMethods(userId: string) {
    return await this.paymentMethodService.listPaymentMethods(userId);
  }

  /**
   * Create subscription for recurring savings plan
   *
   * @param userId - User ID
   * @param recurringPlanId - Recurring plan ID
   * @param priceId - Stripe price ID
   * @param paymentMethodId - Payment method ID
   * @returns Created subscription
   */
  async createRecurringSubscription(
    userId: string,
    recurringPlanId: string,
    priceId: string,
    paymentMethodId?: string,
  ): Promise<Stripe.Subscription> {
    try {
      const customer = await this.prisma.stripeCustomer.findUnique({
        where: { userId },
      });

      if (!customer) {
        throw new Error('Customer not found. Please create a payment first.');
      }

      return await this.subscriptionService.createSubscription({
        stripeCustomerId: customer.stripeCustomerId,
        userId,
        priceId,
        recurringPlanId,
        paymentMethodId,
        metadata: {
          type: 'recurring_savings',
        },
      });
    } catch (error) {
      this.errorHandler.handleError(error, 'createRecurringSubscription');
    }
  }

  /**
   * Cancel subscription
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
      return await this.subscriptionService.cancelSubscription(subscriptionId, cancelAtPeriodEnd);
    } catch (error) {
      this.errorHandler.handleError(error, 'cancelSubscription');
    }
  }

  /**
   * Process webhook event
   *
   * @param rawBody - Raw request body
   * @param signature - Stripe signature
   * @returns Processing result
   */
  async processWebhook(
    rawBody: string | Buffer,
    signature: string,
  ): Promise<{ processed: boolean; message: string }> {
    try {
      const event = this.webhookService.constructEvent(rawBody, signature);
      return await this.webhookService.processEvent(event);
    } catch (error) {
      this.errorHandler.handleError(error, 'processWebhook');
    }
  }

  /**
   * Get payment history for user
   *
   * @param userId - User ID
   * @param limit - Number of payments to return
   * @returns List of payments
   */
  async getPaymentHistory(userId: string, limit: number = 20) {
    return await this.prisma.stripePayment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get customer details
   *
   * @param userId - User ID
   * @returns Stripe customer or null
   */
  async getCustomer(userId: string): Promise<Stripe.Customer | null> {
    return await this.customerService.getCustomerByUserId(userId);
  }

  /**
   * Refund a payment
   *
   * @param paymentIntentId - Payment intent ID
   * @param reason - Refund reason
   * @returns Refund object
   */
  async refundPayment(
    paymentIntentId: string,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer',
  ): Promise<Stripe.Refund> {
    try {
      return await this.paymentIntentService.refundPayment(paymentIntentId, undefined, reason);
    } catch (error) {
      this.errorHandler.handleError(error, 'refundPayment');
    }
  }
}
