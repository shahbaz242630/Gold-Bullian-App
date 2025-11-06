import { BaseApiClient } from './base.client';

/**
 * Wallet API client
 * Handles wallet-related operations
 */
export class WalletApiClient extends BaseApiClient {
  async getWallets(userId: string) {
    return this.request<{ wallets: any[] }>(`/api/wallets/${userId}`);
  }

  async getWallet(userId: string, type: 'GOLD' | 'FEE') {
    return this.request(`/api/wallets/${userId}/${type}`);
  }
}

export const walletApi = new WalletApiClient();
