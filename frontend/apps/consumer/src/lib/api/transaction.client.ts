import { BaseApiClient } from './base.client';

interface BuyGoldData {
  userId: string;
  goldGrams?: number;
  fiatAmount?: number;
  fiatCurrency?: string;
}

interface SellGoldData {
  userId: string;
  goldGrams: number;
}

interface WithdrawCashData {
  userId: string;
  fiatAmount: number;
  fiatCurrency?: string;
  bankAccount: {
    accountNumber: string;
    bankName: string;
    accountHolderName: string;
    iban?: string;
  };
}

interface WithdrawPhysicalData {
  userId: string;
  goldGrams: number;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

/**
 * Transaction API client
 * Handles all transaction-related operations
 */
export class TransactionApiClient extends BaseApiClient {
  async getTransactions(userId: string, page: number = 1, limit: number = 20) {
    return this.request<{
      transactions: any[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/transactions?userId=${userId}&page=${page}&limit=${limit}`);
  }

  async buyGold(data: BuyGoldData) {
    return this.request('/api/transactions/buy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sellGold(data: SellGoldData) {
    return this.request('/api/transactions/sell', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async withdrawCash(data: WithdrawCashData) {
    return this.request('/api/transactions/withdraw/cash', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async withdrawPhysical(data: WithdrawPhysicalData) {
    return this.request('/api/transactions/withdraw/physical', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const transactionApi = new TransactionApiClient();
