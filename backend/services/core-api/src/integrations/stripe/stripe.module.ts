import { Global, Module } from '@nestjs/common';

import { ConfigModule } from '../../config/config.module';
import { StripeService } from './stripe.service';

/**
 * Stripe Integration Module
 *
 * Global module providing Stripe SDK client throughout the application
 *
 * Features:
 * - Global scope (no need to import in each module)
 * - Singleton instance of Stripe client
 * - Automatic configuration from environment variables
 * - Ready for dependency injection
 *
 * Usage:
 * Simply inject StripeService in any service/controller:
 * ```typescript
 * constructor(private readonly stripeService: StripeService) {}
 * ```
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
