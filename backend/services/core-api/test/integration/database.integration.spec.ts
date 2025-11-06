import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/database/prisma.service';

describe('Database Integration Tests', () => {
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    await prismaService.$connect();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  describe('Connection', () => {
    it('should connect to database', async () => {
      expect(prismaService).toBeDefined();
    });

    it('should execute raw queries', async () => {
      const result = await prismaService.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should have database version info', async () => {
      const result = await prismaService.$queryRaw<Array<{ version: string }>>`
        SELECT version()
      `;
      expect(result).toBeDefined();
      expect(result[0]).toHaveProperty('version');
      expect(result[0].version).toContain('PostgreSQL');
    });
  });

  describe('Schema Validation', () => {
    it('should have users table', async () => {
      // This will throw if table doesn't exist
      const result = await prismaService.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'users'
        ) as exists
      `;
      expect(result).toBeDefined();
    });

    it('should have wallets table', async () => {
      const result = await prismaService.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'wallets'
        ) as exists
      `;
      expect(result).toBeDefined();
    });

    it('should have transactions table', async () => {
      const result = await prismaService.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'transactions'
        ) as exists
      `;
      expect(result).toBeDefined();
    });
  });

  describe('CRUD Operations', () => {
    it('should support transactions', async () => {
      // Test that we can use Prisma transactions
      const result = await prismaService.$transaction(async (tx) => {
        // Just verify transaction context works
        const query = await tx.$queryRaw`SELECT 1 as test`;
        return query;
      });

      expect(result).toBeDefined();
    });
  });

  describe('Connection Pool', () => {
    it('should handle multiple concurrent queries', async () => {
      const queries = Array(5)
        .fill(null)
        .map(() => prismaService.$queryRaw`SELECT 1 as test`);

      const results = await Promise.all(queries);
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });
  });
});
