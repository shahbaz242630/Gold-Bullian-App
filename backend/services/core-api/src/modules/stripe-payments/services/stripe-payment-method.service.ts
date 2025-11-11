import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';

import { StripePaymentMethodType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { StripeService } from '../../../integrations/stripe/stripe.service';
import { StripeErrorHandlerService } from './stripe-error-handler.service';

/**
 * Stripe Payment Method Service
 *
 * Manages payment methods (cards, bank accounts, etc.)
 *
 * Features:
 * - Attach payment methods to customers
 * - Detach payment methods
 * - Set default payment method
 * - List payment methods
 * - Update payment method details
 */
@Injectable()
export class StripePaymentMethodService {
  private readonly logger = new Logger(StripePaymentMethodService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly errorHandler: StripeErrorHandlerService,
  ) {}

  /**
   * Attach payment method to customer and save to database
   *
   * @param params - Attachment parameters
   * @returns Payment method
   */
  async attachPaymentMethod(params: {
    paymentMethodId: string;
    stripeCustomerId: string;
    userId: string;
    setAsDefault?: boolean;
  }): Promise<Stripe.PaymentMethod> {
    try {
      const stripe = this.stripeService.getClient();

      // Attach to customer
      const paymentMethod = await stripe.paymentMethods.attach(params.paymentMethodId, {
        customer: params.stripeCustomerId,
      });

      // Set as default if requested
      if (params.setAsDefault) {
        await stripe.customers.update(params.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: params.paymentMethodId,
          },
        });
      }

      // Save to database
      await this.prisma.stripePaymentMethod.create({
        data: {
          stripeCustomerId: params.stripeCustomerId,
          stripePaymentMethodId: params.paymentMethodId,
          userId: params.userId,
          type: this.mapPaymentMethodType(paymentMethod.type),
          cardBrand: paymentMethod.card?.brand,
          cardLast4: paymentMethod.card?.last4,
          cardExpMonth: paymentMethod.card?.exp_month,
          cardExpYear: paymentMethod.card?.exp_year,
          isDefault: params.setAsDefault || false,
          billingDetails: paymentMethod.billing_details as any,
        },
      });

      this.logger.log(`Attached payment method ${params.paymentMethodId} to customer ${params.stripeCustomerId}`);
      return paymentMethod;
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
      const stripe = this.stripeService.getClient();

      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

      // Remove from database
      await this.prisma.stripePaymentMethod.delete({
        where: { stripePaymentMethodId: paymentMethodId },
      });

      this.logger.log(`Detached payment method: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      this.errorHandler.handleError(error, 'detachPaymentMethod');
    }
  }

  /**
   * Set default payment method for customer
   *
   * @param stripeCustomerId - Customer ID
   * @param userId - User ID
   * @param paymentMethodId - Payment method ID
   */
  async setDefaultPaymentMethod(
    stripeCustomerId: string,
    userId: string,
    paymentMethodId: string,
  ): Promise<void> {
    try {
      const stripe = this.stripeService.getClient();

      // Update in Stripe
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update all payment methods for this customer to not be default
      await this.prisma.stripePaymentMethod.updateMany({
        where: { stripeCustomerId, userId },
        data: { isDefault: false },
      });

      // Set the new default
      await this.prisma.stripePaymentMethod.update({
        where: { stripePaymentMethodId: paymentMethodId },
        data: { isDefault: true },
      });

      this.logger.log(`Set default payment method: ${paymentMethodId} for customer ${stripeCustomerId}`);
    } catch (error) {
      this.errorHandler.handleError(error, 'setDefaultPaymentMethod');
    }
  }

  /**
   * Get payment method details
   *
   * @param paymentMethodId - Payment method ID
   * @returns Payment method
   */
  async getPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const stripe = this.stripeService.getClient();
      return await stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      this.errorHandler.handleError(error, 'getPaymentMethod');
    }
  }

  /**
   * List payment methods for a user
   *
   * @param userId - User ID
   * @returns List of payment methods
   */
  async listPaymentMethods(userId: string) {
    return await this.prisma.stripePaymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get default payment method for user
   *
   * @param userId - User ID
   * @returns Default payment method or null
   */
  async getDefaultPaymentMethod(userId: string) {
    return await this.prisma.stripePaymentMethod.findFirst({
      where: { userId, isDefault: true },
    });
  }

  /**
   * Delete payment method from database only (after webhook confirmation)
   *
   * @param paymentMethodId - Payment method ID
   */
  async deletePaymentMethodFromDb(paymentMethodId: string): Promise<void> {
    await this.prisma.stripePaymentMethod.deleteMany({
      where: { stripePaymentMethodId: paymentMethodId },
    });
    this.logger.debug(`Deleted payment method from database: ${paymentMethodId}`);
  }

  /**
   * Map Stripe payment method type to database enum
   *
   * @param type - Stripe payment method type
   * @returns Database payment method type
   */
  private mapPaymentMethodType(type: string): StripePaymentMethodType {
    const typeMap: Record<string, string> = {
      card: 'CARD',
      us_bank_account: 'BANK_ACCOUNT',
      // Add more types as needed
    };
    return (typeMap[type] || 'CARD') as StripePaymentMethodType;
  }
}
