import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { StripePaymentsController } from './stripe-payments.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripePaymentsService } from './services/stripe-payments.service';
import { StripeCustomerService } from './services/stripe-customer.service';
import { StripePaymentIntentService } from './services/stripe-payment-intent.service';
import { StripePaymentMethodService } from './services/stripe-payment-method.service';
import { StripeSubscriptionService } from './services/stripe-subscription.service';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { StripeValidationService } from './services/stripe-validation.service';
import { StripeErrorHandlerService } from './services/stripe-error-handler.service';

/**
 * Stripe Payments Module
 *
 * Enterprise-level modular architecture for Stripe payment integration
 *
 * Features:
 * - Complete payment processing
 * - Payment method management
 * - Subscription handling
 * - Webhook processing
 * - Full audit trail
 *
 * Architecture:
 * - Main orchestrator service (StripePaymentsService)
 * - 7 specialized services with single responsibilities
 * - 2 controllers (payments + webhooks)
 * - Clean separation of concerns
 * - Easy to test and debug
 * - Scalable and maintainable
 *
 * Specialized Services:
 * 1. StripeCustomerService - Customer management
 * 2. StripePaymentIntentService - Payment processing
 * 3. StripePaymentMethodService - Payment method management
 * 4. StripeSubscriptionService - Subscription handling
 * 5. StripeWebhookService - Webhook event processing
 * 6. StripeValidationService - Business rule validation
 * 7. StripeErrorHandlerService - Error handling
 *
 * Integration Points:
 * - Transaction module (gold purchases)
 * - Recurring Plans module (subscriptions)
 * - Pricing module (gold conversion)
 * - Wallet module (balance updates)
 */
@Module({
  imports: [DatabaseModule],
  controllers: [StripePaymentsController, StripeWebhookController],
  providers: [
    // Main orchestrator
    StripePaymentsService,

    // Specialized services
    StripeCustomerService,
    StripePaymentIntentService,
    StripePaymentMethodService,
    StripeSubscriptionService,
    StripeWebhookService,
    StripeValidationService,
    StripeErrorHandlerService,
  ],
  exports: [StripePaymentsService],
})
export class StripePaymentsModule {}
