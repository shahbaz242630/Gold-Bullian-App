import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/**
 * Stripe Integration Service
 *
 * Enterprise-level wrapper for Stripe SDK
 *
 * Features:
 * - Centralized Stripe client initialization
 * - Automatic API versioning
 * - TypeScript support
 * - Dependency injection ready
 * - Easy to mock for testing
 *
 * Usage:
 * ```typescript
 * constructor(private readonly stripeService: StripeService) {}
 *
 * const client = this.stripeService.getClient();
 * const customer = await client.customers.create({ email: 'user@example.com' });
 * ```
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | null = null;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (secretKey) {
      this.client = new Stripe(secretKey, {
        apiVersion: '2024-11-20.acacia', // Latest stable API version
        typescript: true,
        telemetry: false, // Disable telemetry for privacy
        maxNetworkRetries: 3, // Retry failed requests
        timeout: 80000, // 80 seconds timeout
        appInfo: {
          name: 'Bulliun Gold Platform',
          version: '1.0.0',
          url: 'https://bulliun.com',
        },
      });
      this.isConfigured = true;
      this.logger.log('Stripe client initialized successfully');
    } else {
      this.isConfigured = false;
      this.logger.warn(
        'Stripe is not configured. Set STRIPE_SECRET_KEY environment variable to enable payment features.',
      );
    }
  }

  /**
   * Get the Stripe client instance
   *
   * @throws {Error} If Stripe is not configured
   * @returns Stripe client
   */
  getClient(): Stripe {
    if (!this.client || !this.isConfigured) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      );
    }
    return this.client;
  }

  /**
   * Check if Stripe is configured and ready to use
   *
   * @returns true if Stripe is configured
   */
  isAvailable(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Get webhook secret for signature verification
   *
   * @returns Webhook secret or null if not configured
   */
  getWebhookSecret(): string | null {
    return this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ?? null;
  }

  /**
   * Get publishable key for frontend use
   *
   * @returns Publishable key or null if not configured
   */
  getPublishableKey(): string | null {
    return this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') ?? null;
  }
}
