import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { StripePaymentsModule } from '../../src/modules/stripe-payments/stripe-payments.module';
import { StripeModule } from '../../src/integrations/stripe/stripe.module';
import { ConfigModule } from '../../src/config/config.module';
import { DatabaseModule } from '../../src/database/database.module';

/**
 * Stripe Payments Module Smoke Test
 *
 * Verifies that the module can be imported and initialized
 * without errors
 */
describe('StripePaymentsModule (Smoke Test)', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule, DatabaseModule, StripeModule, StripePaymentsModule],
    }).compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide StripePaymentsService', () => {
    const service = module.get('StripePaymentsService');
    expect(service).toBeDefined();
  });
});
