import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import configuration from '../../src/config/configuration';
import { AppConfigService } from '../../src/config/config.service';
import { SupabaseService } from '../../src/integrations/supabase/supabase.service';

describe('Supabase Integration Tests', () => {
  let supabaseService: SupabaseService;
  let configService: AppConfigService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
      ],
      providers: [AppConfigService, SupabaseService],
    }).compile();

    supabaseService = module.get<SupabaseService>(SupabaseService);
    configService = module.get<AppConfigService>(AppConfigService);
  });

  describe('Service Initialization', () => {
    it('should initialize SupabaseService', () => {
      expect(supabaseService).toBeDefined();
    });

    it('should have a Supabase client', () => {
      const client = supabaseService.getClient();
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });

    it('should load configuration correctly', () => {
      const supabaseUrl = configService.get('SUPABASE_URL');
      const serviceKey = configService.get('SUPABASE_SERVICE_ROLE_KEY');

      expect(supabaseUrl).toBeDefined();
      expect(supabaseUrl).toContain('supabase.co');
      expect(serviceKey).toBeDefined();
      expect(serviceKey.length).toBeGreaterThan(50); // JWT tokens are long
    });
  });

  describe('Authentication', () => {
    it('should have auth methods available', () => {
      const client = supabaseService.getClient();
      expect(client.auth.getUser).toBeDefined();
    });

    it('should reject invalid tokens', async () => {
      const client = supabaseService.getClient();
      const { data, error } = await client.auth.getUser('invalid-token');

      expect(error).toBeDefined();
      expect(data.user).toBeNull();
    });

    // Note: We can't test valid token without creating a real user
    // That would be part of E2E tests with test user fixtures
  });

  describe('Database Access', () => {
    it('should be able to access database', async () => {
      const client = supabaseService.getClient();

      // Try to query a table (this will fail if no tables exist, which is fine for smoke test)
      // We're just checking that the client can attempt queries
      expect(client.from).toBeDefined();
      expect(typeof client.from).toBe('function');
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid Supabase URL format', () => {
      const url = configService.get('SUPABASE_URL');
      expect(url).toMatch(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/);
    });

    it('should have service role key with correct format', () => {
      const key = configService.get('SUPABASE_SERVICE_ROLE_KEY');
      // JWT format: header.payload.signature
      expect(key.split('.')).toHaveLength(3);
    });

    it('should have database URL configured', () => {
      const dbUrl = configService.get('DATABASE_URL');
      expect(dbUrl).toBeDefined();
      expect(dbUrl).toContain('postgresql://');
    });
  });
});
