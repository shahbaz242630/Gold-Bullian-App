import { describe, expect, it, vi } from 'vitest';

import { PricingController } from '../../src/modules/pricing/pricing.controller';
import { PricingService } from '../../src/modules/pricing/pricing.service';

describe('PricingController', () => {
  it('returns current quote response', async () => {
    const service = {
      getEffectiveQuote: vi.fn().mockResolvedValue({
        source: 'override',
        buyPrice: '250.1',
        sellPrice: '248.7',
        currency: 'AED',
        effectiveAt: new Date('2025-01-01T00:00:00Z'),
        isOverride: true,
        overrideReason: 'manual',
      }),
      listSnapshots: vi.fn(),
    } as unknown as PricingService;

    const controller = new PricingController(service);
    const quote = await controller.current();

    expect(quote.source).toBe('override');
    expect(quote.isOverride).toBe(true);
  });
});
