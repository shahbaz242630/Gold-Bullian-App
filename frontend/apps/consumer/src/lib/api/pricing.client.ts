import { BaseApiClient } from './base.client';

interface PriceQuote {
  buyPrice: number;
  sellPrice: number;
  currency: string;
  effectiveAt: string;
}

/**
 * Pricing API client
 * Handles gold pricing operations
 */
export class PricingApiClient extends BaseApiClient {
  async getCurrentPrice() {
    return this.request<PriceQuote>('/api/pricing/current');
  }

  async getPriceHistory(limit: number = 10) {
    return this.request(`/api/pricing/snapshots?limit=${limit}`);
  }
}

export const pricingApi = new PricingApiClient();
