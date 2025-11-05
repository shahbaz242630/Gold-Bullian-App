import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { WalletType, TransactionType, TransactionStatus, KycStatus } from '@prisma/client';
import { SupabaseAuthGuard } from '../../src/modules/auth/guards/supabase-auth.guard';
import { RolesGuard } from '../../src/modules/auth/guards/roles.guard';
import { SupabaseService } from '../../src/integrations/supabase/supabase.service';
import { UsersService } from '../../src/modules/users/users.service';
import { WalletsController } from '../../src/modules/wallets/wallets.controller';
import { WalletsService } from '../../src/modules/wallets/wallets.service';
import { TransactionsController } from '../../src/modules/transactions/transactions.controller';
import { TransactionsService } from '../../src/modules/transactions/transactions.service';
import { PricingController } from '../../src/modules/pricing/pricing.controller';
import { PricingService } from '../../src/modules/pricing/pricing.service';
import { KycController } from '../../src/modules/kyc/kyc.controller';
import { KycService } from '../../src/modules/kyc/kyc.service';
import { NomineesController } from '../../src/modules/nominees/nominees.controller';
import { NomineesService } from '../../src/modules/nominees/nominees.service';

class MockSupabaseService {
  getClient() {
    return {
      auth: {
        // eslint-disable-next-line @typescript-eslint/require-await
        getUser: async (token: string) => {
          if (!token) {
            return { data: { user: null }, error: new Error('missing token') };
          }

          const [role, supabaseUid] = token.split(':');
          return {
            data: {
              user: {
                id: supabaseUid ?? 'user-1',
                email: `${supabaseUid ?? 'user-1'}@bulliun.test`,
                app_metadata: {
                  roles: role === 'admin' ? ['admin'] : ['user'],
                },
              },
            },
            error: null,
          };
        },
      },
    };
  }
}

const walletResponse = {
  id: 'wallet-1',
  userId: 'user-1',
  type: WalletType.GOLD,
  balanceGrams: '1.50000000',
  lockedGrams: '0.00000000',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const transactionResponse = {
  id: 'txn-1',
  userId: 'user-1',
  walletId: 'wallet-1',
  type: TransactionType.BUY,
  status: TransactionStatus.COMPLETED,
  goldGrams: '1.00000000',
  fiatAmount: '250.00',
  fiatCurrency: 'AED',
  feeAmount: '0.00',
  feeCurrency: 'AED',
  referenceCode: 'BUY-123456',
  metadata: null,
  completedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('API smoke tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        WalletsController,
        TransactionsController,
        PricingController,
        KycController,
        NomineesController,
      ],
      providers: [
        SupabaseAuthGuard,
        RolesGuard,
        { provide: SupabaseService, useClass: MockSupabaseService },
        {
          provide: UsersService,
          useValue: {
            findBySupabaseUid: vi.fn((supabaseUid: string) => Promise.resolve({ id: supabaseUid })),
          },
        },
        {
          provide: WalletsService,
          useValue: {
            findAllForUser: vi.fn(() => Promise.resolve([walletResponse])),
            findByUserAndType: vi.fn(() => Promise.resolve(walletResponse)),
          },
        },
        {
          provide: TransactionsService,
          useValue: {
            listByUser: vi.fn(() => Promise.resolve([transactionResponse])),
            buyGold: vi.fn(() => Promise.resolve({ transaction: transactionResponse })),
            sellGold: vi.fn(() => Promise.resolve({ transaction: { ...transactionResponse, type: TransactionType.SELL } })),
            withdrawCash: vi.fn(() =>
              Promise.resolve({
                transaction: {
                  ...transactionResponse,
                  type: TransactionType.WITHDRAW_CASH,
                  referenceCode: 'WDC-123456',
                },
              }),
            ),
            withdrawPhysical: vi.fn(() =>
              Promise.resolve({
                transaction: {
                  ...transactionResponse,
                  type: TransactionType.WITHDRAW_PHYSICAL,
                  referenceCode: 'WDP-123456',
                },
              }),
            ),
          },
        },
        {
          provide: PricingService,
          useValue: {
            getEffectiveQuote: vi.fn(() =>
              Promise.resolve({
                source: 'override',
                buyPrice: '250.50',
                sellPrice: '245.10',
                currency: 'AED',
                effectiveAt: new Date('2025-01-01T00:00:00Z'),
                overrideReason: 'manual',
                isOverride: true,
              }),
            ),
            listSnapshots: vi.fn(() =>
              Promise.resolve([
                {
                  id: 'snap-1',
                  source: 'market',
                  buyPrice: '249.00',
                  sellPrice: '244.10',
                  currency: 'AED',
                  effectiveAt: new Date('2025-01-01T00:00:00Z'),
                  createdAt: new Date('2025-01-01T00:00:01Z'),
                },
              ]),
            ),
          },
        },
        {
          provide: KycService,
          useValue: {
            getProfileByUserId: vi.fn(() =>
              Promise.resolve({
                id: 'kyc-1',
                userId: 'user-1',
                provider: 'digitify',
                providerRef: 'ref-1',
                status: KycStatus.IN_REVIEW,
                submittedAt: new Date(),
                reviewedAt: null,
                reviewerId: null,
                notes: null,
                metadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            ),
            submit: vi.fn(() =>
              Promise.resolve({
                id: 'kyc-1',
                userId: 'user-1',
                provider: 'digitify',
                providerRef: 'ref-1',
                status: KycStatus.IN_REVIEW,
                submittedAt: new Date(),
                reviewedAt: null,
                reviewerId: null,
                notes: null,
                metadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            ),
            updateStatus: vi.fn(() =>
              Promise.resolve({
                id: 'kyc-1',
                userId: 'user-1',
                provider: 'digitify',
                providerRef: 'ref-1',
                status: KycStatus.VERIFIED,
                submittedAt: new Date(),
                reviewedAt: new Date(),
                reviewerId: 'admin-1',
                notes: 'verified',
                metadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            ),
          },
        },
        {
          provide: NomineesService,
          useValue: {
            getByUserId: vi.fn(() =>
              Promise.resolve({
                id: 'nom-1',
                userId: 'user-1',
                fullName: 'John Doe',
                relationship: 'Brother',
                email: 'john@example.com',
                phoneNumber: '+971500000000',
                countryCode: 'AE',
                documents: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            ),
            upsert: vi.fn(() =>
              Promise.resolve({
                id: 'nom-1',
                userId: 'user-1',
                fullName: 'John Doe',
                relationship: 'Brother',
                email: 'john@example.com',
                phoneNumber: '+971500000000',
                countryCode: 'AE',
                documents: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            ),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('retrieves wallet summary for authenticated owner', async () => {
    await request(app.getHttpServer())
      .get('/wallets/user-1')
      .set('Authorization', 'Bearer user:user-1')
      .expect(200)
      .expect((res) => {
        expect(res.body.userId).toBe('user-1');
        expect(res.body.wallets).toHaveLength(1);
      });
  });

  it('prevents wallet access for other users', async () => {
    await request(app.getHttpServer())
      .get('/wallets/user-2')
      .set('Authorization', 'Bearer user:user-1')
      .expect(403);
  });

  it('executes transaction flow endpoints', async () => {
    await request(app.getHttpServer())
      .post('/transactions/buy')
      .set('Authorization', 'Bearer user:user-1')
      .send({ userId: 'user-1', fiatAmount: 100 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/transactions/sell')
      .set('Authorization', 'Bearer user:user-1')
      .send({ userId: 'user-1', goldGrams: 0.25 })
      .expect(201);

    await request(app.getHttpServer())
      .get('/transactions')
      .query({ userId: 'user-1' })
      .set('Authorization', 'Bearer user:user-1')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
      });
  });

  it('provides pricing information to authenticated users', async () => {
    await request(app.getHttpServer())
      .get('/pricing/current')
      .set('Authorization', 'Bearer user:user-1')
      .expect(200)
      .expect((res) => {
        expect(res.body.source).toBe('override');
        expect(res.body.isOverride).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/pricing/snapshots')
      .set('Authorization', 'Bearer user:user-1')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
      });
  });

  it('allows users to manage their KYC profile', async () => {
    await request(app.getHttpServer())
      .post('/kyc/submit')
      .set('Authorization', 'Bearer user:user-1')
      .send({ userId: 'user-1', provider: 'digitify' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/kyc/user-1')
      .set('Authorization', 'Bearer user:user-1')
      .expect(200);
  });

  it('restricts KYC status updates to admins', async () => {
    await request(app.getHttpServer())
      .post('/kyc/admin/status')
      .set('Authorization', 'Bearer user:user-1')
      .send({ userId: 'user-1', status: KycStatus.VERIFIED })
      .expect(403);

    await request(app.getHttpServer())
      .post('/kyc/admin/status')
      .set('Authorization', 'Bearer admin:admin-1')
      .send({ userId: 'user-1', status: KycStatus.VERIFIED })
      .expect(201);
  });

  it('allows users to upsert their nominee', async () => {
    await request(app.getHttpServer())
      .post('/nominees')
      .set('Authorization', 'Bearer user:user-1')
      .send({ userId: 'user-1', fullName: 'John Doe', relationship: 'Brother' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/nominees/user-1')
      .set('Authorization', 'Bearer user:user-1')
      .expect(200)
      .expect((res) => {
        expect(res.body.fullName).toBe('John Doe');
      });
  });
});
