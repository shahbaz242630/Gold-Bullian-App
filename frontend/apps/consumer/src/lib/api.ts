import { supabase } from './supabase';

// Get API base URL from environment or default to localhost
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    countryCode: string;
  }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Wallets
  async getWallets(userId: string) {
    return this.request<{ wallets: any[] }>(`/api/wallets/${userId}`);
  }

  async getWallet(userId: string, type: 'GOLD' | 'FEE') {
    return this.request(`/api/wallets/${userId}/${type}`);
  }

  // Pricing
  async getCurrentPrice() {
    return this.request<{
      buyPrice: number;
      sellPrice: number;
      currency: string;
      effectiveAt: string;
    }>('/api/pricing/current');
  }

  async getPriceHistory(limit: number = 10) {
    return this.request(`/api/pricing/snapshots?limit=${limit}`);
  }

  // Transactions
  async getTransactions(userId: string, page: number = 1, limit: number = 20) {
    return this.request<{
      transactions: any[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/transactions?userId=${userId}&page=${page}&limit=${limit}`);
  }

  async buyGold(data: {
    userId: string;
    goldGrams?: number;
    fiatAmount?: number;
    fiatCurrency?: string;
  }) {
    return this.request('/api/transactions/buy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sellGold(data: { userId: string; goldGrams: number }) {
    return this.request('/api/transactions/sell', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async withdrawCash(data: {
    userId: string;
    fiatAmount: number;
    fiatCurrency?: string;
    bankAccount: {
      accountNumber: string;
      bankName: string;
      accountHolderName: string;
      iban?: string;
    };
  }) {
    return this.request('/api/transactions/withdraw/cash', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async withdrawPhysical(data: {
    userId: string;
    goldGrams: number;
    deliveryAddress: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  }) {
    return this.request('/api/transactions/withdraw/physical', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // KYC
  async getKycProfile(userId: string) {
    return this.request(`/api/kyc/${userId}`);
  }

  async submitKyc(data: {
    userId: string;
    provider: string;
    providerRef?: string;
    metadata?: Record<string, any>;
  }) {
    return this.request('/api/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Nominees
  async getNominee(userId: string) {
    return this.request(`/api/nominees/${userId}`);
  }

  async updateNominee(data: {
    userId: string;
    fullName: string;
    relationship: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
    documents?: Record<string, any>;
  }) {
    return this.request('/api/nominees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
