import { BadRequestException } from '@nestjs/common';
import { KycStatus, OnboardingStep, User } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';

const buildUserModel = (): User => ({
  id: 'user-1',
  supabaseUid: 'supabase-uid',
  email: 'user@example.com',
  phoneNumber: '+971500000000',
  firstName: 'Jane',
  lastName: 'Doe',
  countryCode: 'ARE',
  kycStatus: KycStatus.PENDING,
  onboardingStep: OnboardingStep.ACCOUNT_CREATED,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
});

describe('AuthService', () => {
  const supabaseClientMock = () => {
    const admin = {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    };

    const auth = {
      admin,
      signInWithPassword: vi.fn(),
    };

    return { auth };
  };

  let authService: AuthService;
  let supabaseService: { getClient: ReturnType<typeof vi.fn> };
  let usersService: {
    createWithDefaults: ReturnType<typeof vi.fn>;
    findBySupabaseUid: ReturnType<typeof vi.fn>;
  };
  let client: ReturnType<typeof supabaseClientMock>;

  beforeEach(() => {
    client = supabaseClientMock();
    supabaseService = {
      getClient: vi.fn().mockReturnValue(client),
    };

    usersService = {
      createWithDefaults: vi.fn().mockResolvedValue(buildUserModel()),
      findBySupabaseUid: vi.fn().mockResolvedValue(buildUserModel()),
    };

    authService = new AuthService(supabaseService as any, usersService as any);

    client.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'supabase-uid', email: 'user@example.com', phone: '+971500000000' } },
      error: null,
    });

    client.auth.admin.deleteUser.mockResolvedValue({});

    client.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          token_type: 'bearer',
          expires_in: 3600,
          user: { id: 'supabase-uid', email: 'user@example.com' },
        },
      },
      error: null,
    });
  });

  it('throws when terms are not accepted', async () => {
    const request = {
      email: 'user@example.com',
      password: 'supersecurepassword',
      acceptedTerms: false,
    } as RegisterRequestDto;

    await expect(authService.register(request)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registers a user and returns tokens', async () => {
    const request: RegisterRequestDto = {
      email: 'user@example.com',
      password: 'supersecurepassword',
      acceptedTerms: true,
      firstName: 'Jane',
      lastName: 'Doe',
      countryCode: 'ARE',
    };

    const response = await authService.register(request);

    expect(response.accessToken).toBe('access-token');
    expect(response.refreshToken).toBe('refresh-token');
    expect(client.auth.admin.createUser).toHaveBeenCalled();
    expect(usersService.createWithDefaults).toHaveBeenCalledWith({
      supabaseUid: 'supabase-uid',
      email: 'user@example.com',
      phoneNumber: '+971500000000',
      firstName: 'Jane',
      lastName: 'Doe',
      countryCode: 'ARE',
    });
  });

  it('logs in a user and rehydrates local record when missing', async () => {
    usersService.findBySupabaseUid.mockResolvedValueOnce(null);

    const request: LoginRequestDto = {
      email: 'user@example.com',
      password: 'supersecurepassword',
    };

    const response = await authService.login(request);

    expect(response.accessToken).toBe('access-token');
    expect(usersService.createWithDefaults).toHaveBeenCalled();
  });
});


