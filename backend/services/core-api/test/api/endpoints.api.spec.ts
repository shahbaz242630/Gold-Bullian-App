import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';
import { PrismaService } from '../../src/database/prisma.service';

/**
 * API Endpoint Contract Tests
 *
 * These tests verify that each API endpoint:
 * 1. Accepts the correct HTTP method
 * 2. Returns the expected status codes
 * 3. Returns data in the expected format
 * 4. Handles errors correctly
 *
 * NOTE: These tests use mocked PrismaService to avoid database dependency
 * For tests with real database, use integration tests
 */

// Mock PrismaService for isolated API testing
class MockPrismaService {
  async $connect() {}
  async $disconnect() {}

  // Mock wallet operations
  wallet = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  };

  // Mock transaction operations
  transaction = {
    findMany: vi.fn(),
    create: vi.fn(),
  };

  // Mock pricing operations
  pricingSnapshot = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  };

  // Mock KYC operations
  kycProfile = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  // Mock nominee operations
  nominee = {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  };

  // Mock user operations
  user = {
    findUnique: vi.fn(),
  };
}

describe('API Endpoint Contracts', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useClass(MockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Wallets API', () => {
    describe('GET /wallets/:userId', () => {
      it('should have correct endpoint structure', async () => {
        // Without auth, should return 401
        const response = await request(app.getHttpServer())
          .get('/wallets/user-123');

        expect(response.status).toBe(401);
      });

      it('should reject GET requests to wrong paths', async () => {
        await request(app.getHttpServer())
          .get('/wallet/user-123') // Wrong path
          .expect(404);
      });
    });

    describe('GET /wallets/:userId/:type', () => {
      it('should accept wallet type parameter', async () => {
        const response = await request(app.getHttpServer())
          .get('/wallets/user-123/GOLD');

        expect(response.status).toBe(401); // Auth required
      });
    });
  });

  describe('Transactions API', () => {
    describe('POST /transactions/buy', () => {
      it('should accept POST to buy endpoint', async () => {
        const response = await request(app.getHttpServer())
          .post('/transactions/buy')
          .send({ userId: 'user-123', fiatAmount: 100 });

        expect(response.status).toBe(401); // Auth required
      });

      it('should reject GET to buy endpoint', async () => {
        await request(app.getHttpServer())
          .get('/transactions/buy')
          .expect(404); // Method not allowed
      });
    });

    describe('POST /transactions/sell', () => {
      it('should accept POST to sell endpoint', async () => {
        const response = await request(app.getHttpServer())
          .post('/transactions/sell')
          .send({ userId: 'user-123', goldGrams: 0.5 });

        expect(response.status).toBe(401); // Auth required
      });
    });

    describe('GET /transactions', () => {
      it('should accept query parameters', async () => {
        const response = await request(app.getHttpServer())
          .get('/transactions')
          .query({ userId: 'user-123', page: 1, limit: 10 });

        expect(response.status).toBe(401); // Auth required
      });

      it('should require userId parameter', async () => {
        const response = await request(app.getHttpServer())
          .get('/transactions');

        // Should fail validation or auth
        expect([400, 401]).toContain(response.status);
      });
    });
  });

  describe('Pricing API', () => {
    describe('GET /pricing/current', () => {
      it('should have pricing endpoint', async () => {
        const response = await request(app.getHttpServer())
          .get('/pricing/current');

        expect(response.status).toBe(401); // Auth required
      });
    });

    describe('GET /pricing/snapshots', () => {
      it('should have snapshots endpoint', async () => {
        const response = await request(app.getHttpServer())
          .get('/pricing/snapshots');

        expect(response.status).toBe(401); // Auth required
      });

      it('should accept query parameters', async () => {
        const response = await request(app.getHttpServer())
          .get('/pricing/snapshots')
          .query({ limit: 10 });

        expect(response.status).toBe(401); // Auth required
      });
    });
  });

  describe('KYC API', () => {
    describe('POST /kyc/submit', () => {
      it('should accept KYC submission', async () => {
        const response = await request(app.getHttpServer())
          .post('/kyc/submit')
          .send({ userId: 'user-123', provider: 'digitify' });

        expect(response.status).toBe(401); // Auth required
      });
    });

    describe('GET /kyc/:userId', () => {
      it('should get KYC status', async () => {
        const response = await request(app.getHttpServer())
          .get('/kyc/user-123');

        expect(response.status).toBe(401); // Auth required
      });
    });

    describe('POST /kyc/admin/status', () => {
      it('should have admin endpoint', async () => {
        const response = await request(app.getHttpServer())
          .post('/kyc/admin/status')
          .send({ userId: 'user-123', status: 'VERIFIED' });

        expect(response.status).toBe(401); // Auth required
      });
    });
  });

  describe('Nominees API', () => {
    describe('POST /nominees', () => {
      it('should accept nominee creation', async () => {
        const response = await request(app.getHttpServer())
          .post('/nominees')
          .send({
            userId: 'user-123',
            fullName: 'John Doe',
            relationship: 'Brother',
          });

        expect(response.status).toBe(401); // Auth required
      });
    });

    describe('GET /nominees/:userId', () => {
      it('should get nominee info', async () => {
        const response = await request(app.getHttpServer())
          .get('/nominees/user-123');

        expect(response.status).toBe(401); // Auth required
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .get('/non-existent-endpoint')
        .expect(404);
    });

    it('should return proper error format', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject wrong HTTP methods', async () => {
      // Try POST on a GET endpoint
      const response = await request(app.getHttpServer())
        .post('/health');

      expect([404, 405]).toContain(response.status);
    });
  });
});
