import { BaseApiClient } from './base.client';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string;
}

/**
 * Authentication API client
 * Handles user registration and login
 */
export class AuthApiClient extends BaseApiClient {
  async register(data: RegisterData) {
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
}

export const authApi = new AuthApiClient();
