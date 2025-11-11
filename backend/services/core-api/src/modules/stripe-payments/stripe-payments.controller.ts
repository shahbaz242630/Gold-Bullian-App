import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { StripePaymentsService } from './services/stripe-payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { AttachPaymentMethodDto } from './dto/attach-payment-method.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentIntentEntity } from './entities/payment-intent.entity';
import { PaymentMethodEntity } from './entities/payment-method.entity';
import { PaymentConfigEntity } from './entities/payment-config.entity';

/**
 * Stripe Payments Controller
 *
 * RESTful API endpoints for Stripe payment operations
 *
 * Endpoints:
 * - GET /payments/config - Get Stripe configuration
 * - POST /payments/create-intent - Create payment intent
 * - POST /payments/confirm - Confirm payment
 * - POST /payments/payment-methods - Attach payment method
 * - GET /payments/payment-methods/:userId - List payment methods
 * - DELETE /payments/payment-methods/:id - Remove payment method
 * - POST /payments/subscriptions - Create subscription
 * - POST /payments/subscriptions/cancel - Cancel subscription
 * - GET /payments/history/:userId - Get payment history
 * - POST /payments/refund - Refund payment
 */
@Controller('payments')
@UseGuards(SupabaseAuthGuard)
export class StripePaymentsController {
  constructor(private readonly stripePayments: StripePaymentsService) {}

  // ==================== Configuration ====================

  /**
   * GET /payments/config
   * Get Stripe configuration for frontend
   */
  @Get('config')
  async getConfig(): Promise<PaymentConfigEntity> {
    return new PaymentConfigEntity({
      isAvailable: this.stripePayments.isAvailable(),
      publishableKey: this.stripePayments.getPublishableKey(),
    });
  }

  // ==================== Payment Intents ====================

  /**
   * POST /payments/create-intent
   * Create a payment intent for gold purchase
   */
  @Post('create-intent')
  async createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @Query('userId') userId: string,
  ): Promise<PaymentIntentEntity> {
    const { paymentIntent, clientSecret } = await this.stripePayments.createGoldPurchaseIntent(
      userId,
      dto.amountAED,
      dto.metadata,
    );

    return new PaymentIntentEntity({
      id: paymentIntent.id,
      clientSecret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      createdAt: new Date(paymentIntent.created * 1000),
    });
  }

  /**
   * POST /payments/confirm
   * Confirm a payment intent
   */
  @Post('confirm')
  async confirmPayment(@Body() dto: ConfirmPaymentDto) {
    const result = await this.stripePayments.confirmGoldPurchase(dto.paymentIntentId);

    return {
      success: result.success,
      paymentIntent: new PaymentIntentEntity({
        id: result.paymentIntent.id,
        clientSecret: result.paymentIntent.client_secret || '',
        amount: result.paymentIntent.amount,
        currency: result.paymentIntent.currency,
        status: result.paymentIntent.status,
        createdAt: new Date(result.paymentIntent.created * 1000),
      }),
    };
  }

  /**
   * GET /payments/history/:userId
   * Get payment history for user
   */
  @Get('history/:userId')
  async getPaymentHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const payments = await this.stripePayments.getPaymentHistory(
      userId,
      limit ? parseInt(limit, 10) : 20,
    );

    return payments.map(
      (p) =>
        new PaymentIntentEntity({
          id: p.stripePaymentIntentId,
          clientSecret: '', // Don't expose client secret in history
          amount: Number(p.amount) * 100, // Convert back to smallest unit
          currency: p.currency,
          status: p.status,
          paymentMethodId: p.paymentMethodId || undefined,
          receiptUrl: p.receiptUrl || undefined,
          createdAt: p.createdAt,
        }),
    );
  }

  // ==================== Payment Methods ====================

  /**
   * POST /payments/payment-methods
   * Attach a payment method to customer
   */
  @Post('payment-methods')
  async attachPaymentMethod(
    @Body() dto: AttachPaymentMethodDto,
    @Query('userId') userId: string,
  ) {
    const paymentMethod = await this.stripePayments.attachPaymentMethod(
      userId,
      dto.paymentMethodId,
      dto.setAsDefault || false,
    );

    return {
      success: true,
      paymentMethodId: paymentMethod.id,
    };
  }

  /**
   * GET /payments/payment-methods/:userId
   * List user's payment methods
   */
  @Get('payment-methods/:userId')
  async listPaymentMethods(@Param('userId') userId: string): Promise<PaymentMethodEntity[]> {
    const methods = await this.stripePayments.listPaymentMethods(userId);

    return methods.map(
      (m) =>
        new PaymentMethodEntity({
          id: m.stripePaymentMethodId,
          type: m.type,
          cardBrand: m.cardBrand || undefined,
          cardLast4: m.cardLast4 || undefined,
          cardExpMonth: m.cardExpMonth || undefined,
          cardExpYear: m.cardExpYear || undefined,
          isDefault: m.isDefault,
          createdAt: m.createdAt,
        }),
    );
  }

  /**
   * DELETE /payments/payment-methods/:id
   * Remove payment method
   */
  @Delete('payment-methods/:id')
  async removePaymentMethod(@Param('id') paymentMethodId: string) {
    await this.stripePayments.detachPaymentMethod(paymentMethodId);
    return { success: true };
  }

  // ==================== Subscriptions ====================

  /**
   * POST /payments/subscriptions
   * Create a subscription for recurring payments
   */
  @Post('subscriptions')
  async createSubscription(
    @Body() dto: CreateSubscriptionDto,
    @Query('userId') userId: string,
  ) {
    const subscription = await this.stripePayments.createRecurringSubscription(
      userId,
      dto.recurringPlanId || '',
      dto.priceId,
      dto.paymentMethodId,
    );

    return {
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
    };
  }

  /**
   * POST /payments/subscriptions/cancel
   * Cancel a subscription
   */
  @Post('subscriptions/cancel')
  async cancelSubscription(@Body() dto: CancelSubscriptionDto) {
    const subscription = await this.stripePayments.cancelSubscription(
      dto.subscriptionId,
      dto.cancelAtPeriodEnd ?? true,
    );

    return {
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }

  // ==================== Refunds ====================

  /**
   * POST /payments/refund
   * Refund a payment
   */
  @Post('refund')
  async refundPayment(@Body() dto: RefundPaymentDto) {
    const refund = await this.stripePayments.refundPayment(dto.paymentIntentId, dto.reason);

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
    };
  }
}
