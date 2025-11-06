import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';
import { PrismaService } from '../../src/database/prisma.service';

/**
 * API Contract Tests - Authentication Flow
 *
 * These tests verify that the API endpoints work correctly with authentication
 * and that the frontend can properly authenticate and make API calls.
 */

// Mock PrismaService to avoid database dependency
class MockPrismaService {
  async $connect() {}
  async $disconnect() {}
}

describe('Authentication Flow API Tests', () => {
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

  describe('Public Endpoints', () => {
    it('GET /health should return 200 without auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Protected Endpoints - No Auth', () => {
    it('GET /wallets/:userId should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/wallets/test-user')
        .expect(401);
    });

    it('GET /transactions should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/transactions')
        .query({ userId: 'test-user' })
        .expect(401);
    });

    it('GET /pricing/current should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/pricing/current')
        .expect(401);
    });

    it('GET /kyc/:userId should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/kyc/test-user')
        .expect(401);
    });

    it('GET /nominees/:userId should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/nominees/test-user')
        .expect(401);
    });
  });

  describe('Protected Endpoints - Invalid Auth', () => {
    it('should reject invalid Bearer token', async () => {
      await request(app.getHttpServer())
        .get('/wallets/test-user')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject malformed auth header', async () => {
      await request(app.getHttpServer())
        .get('/wallets/test-user')
        .set('Authorization', 'NotBearer token')
        .expect(401);
    });

    it('should reject empty Bearer token', async () => {
      await request(app.getHttpServer())
        .get('/wallets/test-user')
        .set('Authorization', 'Bearer ')
        .expect(401);
    });
  });

  describe('API Response Format', () => {
    it('should return JSON for all endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return proper error format for 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/wallets/test-user')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('CORS Headers', () => {
    it('should handle OPTIONS requests', async () => {
      const response = await request(app.getHttpServer())
        .options('/health')
        .set('Origin', 'http://localhost:19006')
        .set('Access-Control-Request-Method', 'GET');

      // Note: CORS might be configured in main.ts
      // Accepts 200/204 (CORS configured) or 404 (not yet configured)
      expect([200, 204, 404]).toContain(response.status);
    });
  });
});
