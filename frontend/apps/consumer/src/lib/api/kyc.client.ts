import { BaseApiClient } from './base.client';

interface SubmitKycData {
  userId: string;
  provider: string;
  providerRef?: string;
  metadata?: Record<string, any>;
}

/**
 * KYC API client
 * Handles Know Your Customer verification operations
 */
export class KycApiClient extends BaseApiClient {
  async getKycProfile(userId: string) {
    return this.request(`/api/kyc/${userId}`);
  }

  async submitKyc(data: SubmitKycData) {
    return this.request('/api/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const kycApi = new KycApiClient();
