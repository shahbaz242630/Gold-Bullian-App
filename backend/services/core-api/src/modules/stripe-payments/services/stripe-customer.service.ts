import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';

import { PrismaService } from '../../../database/prisma.service';
import { StripeService } from '../../../integrations/stripe/stripe.service';
import { StripeErrorHandlerService } from './stripe-error-handler.service';

/**
 * Stripe Customer Service
 *
 * Manages Stripe customer creation, retrieval, and updates
 *
 * Features:
 * - Create Stripe customers
 * - Link users to Stripe customers
 * - Retrieve customer information
 * - Update customer details
 * - Delete customers
 * - Automatic database synchronization
 *
 * Architecture:
 * - Single responsibility: Customer management only
 * - Database-first approach
 * - Idempotent operations
 */
@Injectable()
export class StripeCustomerService {
  private readonly logger = new Logger(StripeCustomerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly errorHandler: StripeErrorHandlerService,
  ) {}

  /**
   * Get or create Stripe customer for a user
   *
   * @param userId - Internal user ID
   * @param email - User email
   * @param name - User full name
   * @param phone - User phone number
   * @returns Stripe customer ID
   */
  async getOrCreateCustomer(
    userId: string,
    email?: string,
    name?: string,
    phone?: string,
  ): Promise<string> {
    try {
      // Check if customer already exists in database
      const existingCustomer = await this.prisma.stripeCustomer.findUnique({
        where: { userId },
      });

      if (existingCustomer) {
        this.logger.debug(`Found existing Stripe customer: ${existingCustomer.stripeCustomerId}`);
        return existingCustomer.stripeCustomerId;
      }

      // Create new Stripe customer
      this.logger.log(`Creating new Stripe customer for user ${userId}`);
      const stripe = this.stripeService.getClient();

      const customer = await stripe.customers.create({
        email,
        name,
        phone,
        metadata: {
          userId,
          platform: 'bulliun',
        },
      });

      // Save to database
      await this.prisma.stripeCustomer.create({
        data: {
          userId,
          stripeCustomerId: customer.id,
          email,
          name,
          phone,
          metadata: {
            stripeCreatedAt: customer.created,
          },
        },
      });

      this.logger.log(`Created Stripe customer: ${customer.id} for user ${userId}`);
      return customer.id;
    } catch (error) {
      this.errorHandler.handleError(error, 'getOrCreateCustomer');
    }
  }

  /**
   * Get Stripe customer by user ID
   *
   * @param userId - Internal user ID
   * @returns Stripe customer or null
   */
  async getCustomerByUserId(userId: string): Promise<Stripe.Customer | null> {
    try {
      const dbCustomer = await this.prisma.stripeCustomer.findUnique({
        where: { userId },
      });

      if (!dbCustomer) {
        return null;
      }

      const stripe = this.stripeService.getClient();
      const customer = await stripe.customers.retrieve(dbCustomer.stripeCustomerId);

      if (customer.deleted) {
        this.logger.warn(`Customer ${dbCustomer.stripeCustomerId} was deleted in Stripe`);
        await this.prisma.stripeCustomer.delete({ where: { userId } });
        return null;
      }

      return customer as Stripe.Customer;
    } catch (error) {
      this.errorHandler.handleError(error, 'getCustomerByUserId');
    }
  }

  /**
   * Update Stripe customer information
   *
   * @param userId - Internal user ID
   * @param data - Update data
   * @returns Updated Stripe customer
   */
  async updateCustomer(
    userId: string,
    data: {
      email?: string;
      name?: string;
      phone?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<Stripe.Customer> {
    try {
      const dbCustomer = await this.prisma.stripeCustomer.findUnique({
        where: { userId },
      });

      if (!dbCustomer) {
        throw new NotFoundException('Stripe customer not found for this user');
      }

      const stripe = this.stripeService.getClient();
      const customer = await stripe.customers.update(dbCustomer.stripeCustomerId, {
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: data.metadata,
      });

      // Update database
      await this.prisma.stripeCustomer.update({
        where: { userId },
        data: {
          email: data.email ?? dbCustomer.email,
          name: data.name ?? dbCustomer.name,
          phone: data.phone ?? dbCustomer.phone,
        },
      });

      this.logger.log(`Updated Stripe customer: ${customer.id}`);
      return customer;
    } catch (error) {
      this.errorHandler.handleError(error, 'updateCustomer');
    }
  }

  /**
   * Delete Stripe customer
   *
   * @param userId - Internal user ID
   * @returns Deleted customer confirmation
   */
  async deleteCustomer(userId: string): Promise<Stripe.DeletedCustomer> {
    try {
      const dbCustomer = await this.prisma.stripeCustomer.findUnique({
        where: { userId },
      });

      if (!dbCustomer) {
        throw new NotFoundException('Stripe customer not found for this user');
      }

      const stripe = this.stripeService.getClient();
      const deleted = await stripe.customers.del(dbCustomer.stripeCustomerId);

      // Remove from database
      await this.prisma.stripeCustomer.delete({
        where: { userId },
      });

      this.logger.log(`Deleted Stripe customer: ${dbCustomer.stripeCustomerId}`);
      return deleted;
    } catch (error) {
      this.errorHandler.handleError(error, 'deleteCustomer');
    }
  }

  /**
   * List all payment methods for a customer
   *
   * @param userId - Internal user ID
   * @param type - Payment method type (optional)
   * @returns List of payment methods
   */
  async listCustomerPaymentMethods(
    userId: string,
    type?: 'card' | 'us_bank_account',
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const dbCustomer = await this.prisma.stripeCustomer.findUnique({
        where: { userId },
      });

      if (!dbCustomer) {
        throw new NotFoundException('Stripe customer not found for this user');
      }

      const stripe = this.stripeService.getClient();
      const paymentMethods = await stripe.customers.listPaymentMethods(dbCustomer.stripeCustomerId, {
        type: type || 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      this.errorHandler.handleError(error, 'listCustomerPaymentMethods');
    }
  }

  /**
   * Check if user has a Stripe customer
   *
   * @param userId - Internal user ID
   * @returns true if customer exists
   */
  async hasCustomer(userId: string): Promise<boolean> {
    const customer = await this.prisma.stripeCustomer.findUnique({
      where: { userId },
    });
    return customer !== null;
  }
}
