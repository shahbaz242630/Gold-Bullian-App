import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';

import { PrismaService } from '../../../database/prisma.service';
import { StripeService } from '../../../integrations/stripe/stripe.service';
import { StripeErrorHandlerService } from './stripe-error-handler.service';
import { StripeValidationService } from './stripe-validation.service';

/**
 * Stripe Payment Intent Service
 *
 * Manages Stripe PaymentIntents for processing payments
 *
 * Features:
 * - Create payment intents
 * - Confirm payment intents
 * - Cancel payment intents
 * - Capture authorized payments
 * - Refund payments
 * - Track payment status
 *
 * Payment Intent Flow:
 * 1. Create intent → 2. Client confirms → 3. Webhook receives status → 4. Update DB
 */
@Injectable()
export class StripePaymentIntentService {
  private readonly logger = new Logger(StripePaymentIntentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly errorHandler: StripeErrorHandlerService,
    private readonly validation: StripeValidationService,
  ) {}

  /**
   * Create a payment intent
   *
   * @param params - Payment intent parameters
   * @returns Created payment intent
   */
  async createPaymentIntent(params: {
    stripeCustomerId: string;
    userId: string;
    amount: number; // in smallest currency unit (e.g., fils for AED)
    currency: string;
    paymentMethodId?: string;
    description?: string;
    metadata?: Record<string, string>;
    captureMethod?: 'automatic' | 'manual';
  }): Promise<Stripe.PaymentIntent> {
    try {
      // Validate inputs
      this.validation.validateAmount(params.amount, params.currency);
      this.validation.validateCurrency(params.currency);

      const stripe = this.stripeService.getClient();

      // Create payment intent in Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        customer: params.stripeCustomerId,
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        payment_method: params.paymentMethodId,
        description: params.description,
        capture_method: params.captureMethod || 'automatic',
        automatic_payment_methods: params.paymentMethodId
          ? undefined
          : {
              enabled: true,
              allow_redirects: 'never', // For now, only instant methods
            },
        metadata: {
          userId: params.userId,
          platform: 'bulliun',
          ...params.metadata,
        },
      });

      // Save to database
      await this.prisma.stripePayment.create({
        data: {
          stripeCustomerId: params.stripeCustomerId,
          stripePaymentIntentId: paymentIntent.id,
          userId: params.userId,
          amount: params.amount / 100, // Convert to decimal
          currency: params.currency.toUpperCase(),
          status: this.mapStripeStatus(paymentIntent.status),
          paymentMethodId: params.paymentMethodId,
          metadata: params.metadata,
        },
      });

      this.logger.log(`Created payment intent: ${paymentIntent.id} for ${params.amount} ${params.currency}`);
      return paymentIntent;
    } catch (error) {
      this.errorHandler.handleError(error, 'createPaymentIntent');
    }
  }

  /**
   * Confirm a payment intent
   *
   * @param paymentIntentId - Payment intent ID
   * @param paymentMethodId - Payment method to use (optional)
   * @returns Confirmed payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const stripe = this.stripeService.getClient();

      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      // Update database
      await this.prisma.stripePayment.update({
        where: { stripePaymentIntentId: paymentIntentId },
        data: {
          status: this.mapStripeStatus(paymentIntent.status),
          paymentMethodId: paymentMethodId || undefined,
        },
      });

      this.logger.log(`Confirmed payment intent: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.errorHandler.handleError(error, 'confirmPaymentIntent');
    }
  }

  /**
   * Cancel a payment intent
   *
   * @param paymentIntentId - Payment intent ID
   * @returns Cancelled payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const stripe = this.stripeService.getClient();

      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

      // Update database
      await this.prisma.stripePayment.update({
        where: { stripePaymentIntentId: paymentIntentId },
        data: {
          status: 'CANCELLED',
        },
      });

      this.logger.log(`Cancelled payment intent: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.errorHandler.handleError(error, 'cancelPaymentIntent');
    }
  }

  /**
   * Capture an authorized payment
   *
   * @param paymentIntentId - Payment intent ID
   * @param amountToCapture - Amount to capture (optional, defaults to full amount)
   * @returns Captured payment intent
   */
  async capturePayment(
    paymentIntentId: string,
    amountToCapture?: number,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const stripe = this.stripeService.getClient();

      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
        amount_to_capture: amountToCapture,
      });

      // Update database
      await this.prisma.stripePayment.update({
        where: { stripePaymentIntentId: paymentIntentId },
        data: {
          status: this.mapStripeStatus(paymentIntent.status),
        },
      });

      this.logger.log(`Captured payment: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.errorHandler.handleError(error, 'capturePayment');
    }
  }

  /**
   * Refund a payment
   *
   * @param paymentIntentId - Payment intent ID
   * @param amount - Amount to refund (optional, defaults to full refund)
   * @param reason - Refund reason
   * @returns Refund object
   */
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer',
  ): Promise<Stripe.Refund> {
    try {
      const stripe = this.stripeService.getClient();

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason,
      });

      // Update database
      await this.prisma.stripePayment.update({
        where: { stripePaymentIntentId: paymentIntentId },
        data: {
          status: 'REFUNDED',
        },
      });

      this.logger.log(`Refunded payment: ${paymentIntentId}, refund ID: ${refund.id}`);
      return refund;
    } catch (error) {
      this.errorHandler.handleError(error, 'refundPayment');
    }
  }

  /**
   * Get payment intent by ID
   *
   * @param paymentIntentId - Payment intent ID
   * @returns Payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const stripe = this.stripeService.getClient();
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.errorHandler.handleError(error, 'getPaymentIntent');
    }
  }

  /**
   * Get payment intent from database
   *
   * @param paymentIntentId - Payment intent ID
   * @returns Database payment record
   */
  async getPaymentFromDb(paymentIntentId: string) {
    const payment = await this.prisma.stripePayment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Update payment status in database
   *
   * @param paymentIntentId - Payment intent ID
   * @param status - New status
   * @param receiptUrl - Receipt URL (optional)
   * @param failureMessage - Failure message (optional)
   */
  async updatePaymentStatus(
    paymentIntentId: string,
    status: string,
    receiptUrl?: string,
    failureMessage?: string,
  ): Promise<void> {
    await this.prisma.stripePayment.update({
      where: { stripePaymentIntentId: paymentIntentId },
      data: {
        status: this.mapStripeStatus(status),
        receiptUrl,
        failureMessage,
      },
    });
  }

  /**
   * Map Stripe payment intent status to database status
   *
   * @param stripeStatus - Stripe status
   * @returns Database status
   */
  private mapStripeStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      requires_payment_method: 'REQUIRES_PAYMENT_METHOD',
      requires_confirmation: 'PENDING',
      requires_action: 'REQUIRES_ACTION',
      processing: 'PROCESSING',
      requires_capture: 'PROCESSING',
      canceled: 'CANCELLED',
      succeeded: 'SUCCEEDED',
    };

    return statusMap[stripeStatus] || 'PENDING';
  }
}
