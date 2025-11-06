import { BaseApiClient } from './base.client';

interface UpdateNomineeData {
  userId: string;
  fullName: string;
  relationship: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  documents?: Record<string, any>;
}

/**
 * Nominee API client
 * Handles nominee management operations
 */
export class NomineeApiClient extends BaseApiClient {
  async getNominee(userId: string) {
    return this.request(`/api/nominees/${userId}`);
  }

  async updateNominee(data: UpdateNomineeData) {
    return this.request('/api/nominees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const nomineeApi = new NomineeApiClient();
