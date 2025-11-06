import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';

/**
 * Smoke Tests
 *
 * These are basic smoke tests to verify the application starts and critical endpoints exist.
 * They are designed to run quickly and catch major integration issues.
 *
 * Note: These tests require proper environment configuration (database, Supabase, etc.)
 * For isolated unit testing, see individual module test files.
 */

describe('API Smoke Tests', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
      );

      await app.init();
      await app.getHttpAdapter().getInstance().ready();
    } catch (error) {
      console.error('Failed to initialize app for smoke tests:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Health Checks', () => {
    it('should have a running server', () => {
      expect(app).toBeDefined();
      expect(app.getHttpAdapter()).toBeDefined();
    });

    it('GET /health should return 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('API Endpoints Exist', () => {
    // These tests verify endpoints exist without auth - they should return 401/403, not 404

    it('Wallets endpoint exists', async () => {
      const response = await request(app.getHttpServer())
        .get('/wallets/test-user');

      // Should get auth error (401), not 404 Not Found
      expect([401, 403]).toContain(response.status);
    });

    it('Transactions endpoint exists', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions')
        .query({ userId: 'test-user' });

      // Should get auth error (401), not 404 Not Found
      expect([401, 403]).toContain(response.status);
    });

    it('Pricing endpoint exists', async () => {
      const response = await request(app.getHttpServer())
        .get('/pricing/current');

      // Should get auth error (401), not 404 Not Found
      expect([401, 403]).toContain(response.status);
    });

    it('KYC endpoint exists', async () => {
      const response = await request(app.getHttpServer())
        .get('/kyc/test-user');

      // Should get auth error (401), not 404 Not Found
      expect([401, 403]).toContain(response.status);
    });

    it('Nominees endpoint exists', async () => {
      const response = await request(app.getHttpServer())
        .get('/nominees/test-user');

      // Should get auth error (401), not 404 Not Found
      expect([401, 403]).toContain(response.status);
    });
  });
});
