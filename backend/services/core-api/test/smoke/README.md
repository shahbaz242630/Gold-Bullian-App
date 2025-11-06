# Smoke Tests

## Overview

Smoke tests are designed to quickly verify that the application starts and critical endpoints are accessible. These are lightweight integration tests that catch major issues.

## Current Status

The smoke tests are currently experiencing dependency injection issues when using NestJS's `Test.createTestingModule()` with the full `AppModule`. Specifically:

- ✅ Environment variables load correctly
- ✅ Test setup configured properly
- ❌ NestJS DI doesn't properly inject `AppConfigService` into `SupabaseService` in test context

This is a known complexity with NestJS testing when modules have complex dependency graphs involving configuration, database connections, and external services.

## Recommended Approaches

### Option 1: E2E Tests Against Running Application

The most reliable approach for smoke testing is to run tests against a live instance:

```bash
# Start the application
npm run dev

# In another terminal, run e2e tests
npm run test:e2e
```

### Option 2: Use Docker Compose for Integration Tests

Set up a complete test environment with all dependencies:

```yaml
# docker-compose.test.yml
services:
  api:
    build: .
    environment:
      - DATABASE_URL=${TEST_DATABASE_URL}
      - SUPABASE_URL=${TEST_SUPABASE_URL}
  # ... other services
```

### Option 3: Unit Tests for Individual Modules

For isolated testing without full application context:

```typescript
// Individual controller/service tests
describe('WalletsService', () => {
  // Mock dependencies explicitly
  const mockPrisma = {...};
  const service = new WalletsService(mockPrisma);

  it('should find wallet', async () => {
    // Test logic
  });
});
```

## Environment Requirements

Smoke tests require these environment variables (from `.env`):

- `DATABASE_URL` - Supabase Postgres connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (not anon key)
- `COOKIE_SECRET` - Secret for cookie signing (min 32 chars)
- `NODE_ENV` - Set to 'test' for test runs
- `CORS_ORIGINS` - Allowed origins for CORS

## Test Setup

The test setup (`test/setup.ts`) automatically:

1. Loads environment variables from `.env`
2. Sets `NODE_ENV=test`
3. Validates all required variables are present

## Running Tests

```bash
# Run smoke tests
npm run smoke

# Run all tests
npm test

# Run with coverage
npm run test:cov
```

## Future Improvements

To make smoke tests work with `AppModule`:

1. **Simplify Config Resolution**: Remove `registerAs` namespacing or ensure `AppConfigService` properly accesses namespaced values
2. **Mock External Services**: Override Supabase and database connections in test module
3. **Test Database**: Use a dedicated test database that's reset between test runs
4. **Test Fixtures**: Create reusable test data fixtures

## Contributing

When adding new endpoints, update the smoke tests to verify they exist and return appropriate status codes (401/403 for auth-protected endpoints, 200 for public ones).
