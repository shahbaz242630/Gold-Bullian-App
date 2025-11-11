import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

import { PrismaService } from '../../../database/prisma.service';
import { StripeService } from '../../../integrations/stripe/stripe.service';
import { StripeErrorHandlerService } from './stripe-error-handler.service';
import { StripeValidationService } from './stripe-validation.service';
import { StripePaymentIntentService } from './stripe-payment-intent.service';
import { StripeSubscriptionService } from './stripe-subscription.service';

/**
 * Stripe Webhook Service
 *
 * Handles incoming Stripe webhook events with:
 * - Signature verification (security)
 * - Idempotency (prevent duplicate processing)
 * - Event routing to appropriate handlers
 * - Automatic retry on failure
 *
 * Security Best Practices:
 * 1. Always verify webhook signature
 * 2. Use raw body (not parsed JSON)
 * 3. Process events idempotently
 * 4. Store events for audit trail
 * 5. Respond quickly (< 5 seconds)
 *
 * Supported Events:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - payment_intent.canceled
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - payment_method.attached
 * - payment_method.detached
 */
@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly errorHandler: StripeErrorHandlerService,
    private readonly validation: StripeValidationService,
    private readonly paymentIntentService: StripePaymentIntentService,
    private readonly subscriptionService: StripeSubscriptionService,
  ) {}

  /**
   * Construct and verify webhook event
   *
   * @param rawBody - Raw request body (not parsed JSON!)
   * @param signature - Stripe signature from header
   * @returns Verified Stripe event
   */
  constructEvent(rawBody: string | Buffer, signature: string): Stripe.Event {
    try {
      const webhookSecret = this.stripeService.getWebhookSecret();

      // Validate signature and secret
      this.validation.validateWebhookSignature(signature, webhookSecret);

      const stripe = this.stripeService.getClient();

      // Construct event with signature verification
      const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret!);

      this.logger.debug(`Verified webhook event: ${event.type} (${event.id})`);
      return event;
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      this.errorHandler.handleError(error, 'constructEvent');
    }
  }

  /**
   * Process webhook event with idempotency
   *
   * @param event - Verified Stripe event
   * @returns Processing result
   */
  async processEvent(event: Stripe.Event): Promise<{ processed: boolean; message: string }> {
    try {
      // Check if event was already processed (idempotency)
      const existingEvent = await this.prisma.stripeWebhookEvent.findUnique({
        where: { stripeEventId: event.id },
      });

      if (existingEvent && existingEvent.status === 'PROCESSED') {
        this.logger.debug(`Event ${event.id} already processed, skipping`);
        return { processed: false, message: 'Event already processed' };
      }

      // Store event in database (for audit trail and idempotency)
      await this.upsertWebhookEvent(event, 'PENDING');

      // Route event to appropriate handler
      await this.routeEvent(event);

      // Mark as processed
      await this.prisma.stripeWebhookEvent.update({
        where: { stripeEventId: event.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });

      this.logger.log(`Successfully processed webhook event: ${event.type} (${event.id})`);
      return { processed: true, message: 'Event processed successfully' };
    } catch (error) {
      this.logger.error(`Failed to process webhook event ${event.id}:`, error);

      // Mark as failed
      await this.prisma.stripeWebhookEvent.update({
        where: { stripeEventId: event.id },
        data: {
          status: 'FAILED',
          failureReason: error instanceof Error ? error.message : 'Unknown error',
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  /**
   * Route event to appropriate handler
   *
   * @param event - Stripe event
   */
  private async routeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      // Payment Intent Events
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.requires_action':
        await this.handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;

      // Subscription Events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      // Payment Method Events
      case 'payment_method.attached':
        await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_method.detached':
        await this.handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
        // Mark as ignored (not failed)
        await this.prisma.stripeWebhookEvent.update({
          where: { stripeEventId: event.id },
          data: { status: 'IGNORED' },
        });
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);

    await this.paymentIntentService.updatePaymentStatus(
      paymentIntent.id,
      paymentIntent.status,
      (paymentIntent as any).charges?.data[0]?.receipt_url || undefined,
    );

    // TODO: Link to Transaction and update wallet balance
    // This will be done in the main StripePaymentsService
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.warn(`Payment failed: ${paymentIntent.id}`);

    await this.paymentIntentService.updatePaymentStatus(
      paymentIntent.id,
      'FAILED',
      undefined,
      paymentIntent.last_payment_error?.message,
    );
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment canceled: ${paymentIntent.id}`);

    await this.paymentIntentService.updatePaymentStatus(paymentIntent.id, 'CANCELLED');
  }

  /**
   * Handle payment requiring action
   */
  private async handlePaymentIntentRequiresAction(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Payment requires action: ${paymentIntent.id}`);

    await this.paymentIntentService.updatePaymentStatus(paymentIntent.id, 'REQUIRES_ACTION');
  }

  /**
   * Handle subscription update
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);

    await this.subscriptionService.updateSubscriptionStatus(subscription.id, subscription.status);

    // TODO: Update RecurringSavingsPlan status
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription deleted: ${subscription.id}`);

    await this.subscriptionService.updateSubscriptionStatus(subscription.id, 'CANCELED');

    // TODO: Cancel RecurringSavingsPlan
  }

  /**
   * Handle payment method attached
   */
  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    this.logger.log(`Payment method attached: ${paymentMethod.id}`);
    // Payment method is already saved when attached, no additional action needed
  }

  /**
   * Handle payment method detached
   */
  private async handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    this.logger.log(`Payment method detached: ${paymentMethod.id}`);
    // Payment method is already removed when detached, no additional action needed
  }

  /**
   * Upsert webhook event in database
   *
   * @param event - Stripe event
   * @param status - Event status
   */
  private async upsertWebhookEvent(
    event: Stripe.Event,
    status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'IGNORED',
  ): Promise<void> {
    await this.prisma.stripeWebhookEvent.upsert({
      where: { stripeEventId: event.id },
      create: {
        stripeEventId: event.id,
        type: event.type,
        status,
        payload: event as any,
      },
      update: {
        status,
        payload: event as any,
      },
    });
  }

  /**
   * Retry failed events
   *
   * @param maxRetries - Maximum number of retries
   * @returns Number of events retried
   */
  async retryFailedEvents(maxRetries: number = 3): Promise<number> {
    const failedEvents = await this.prisma.stripeWebhookEvent.findMany({
      where: {
        status: 'FAILED',
        retryCount: { lt: maxRetries },
      },
      take: 10, // Process 10 at a time
    });

    let retriedCount = 0;

    for (const event of failedEvents) {
      try {
        await this.processEvent(event.payload as any);
        retriedCount++;
      } catch (error) {
        this.logger.error(`Retry failed for event ${event.stripeEventId}:`, error);
      }
    }

    this.logger.log(`Retried ${retriedCount} failed webhook events`);
    return retriedCount;
  }
}
