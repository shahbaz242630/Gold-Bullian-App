# Gold Bullion Platform - Comprehensive Test Plan

## Testing Strategy Overview

This document outlines the comprehensive testing strategy to ensure:
1. ✅ All backend services are wired up properly
2. ✅ Supabase is connected and functioning
3. ✅ Frontend and backend are integrated correctly
4. ✅ Frontend sends commands to correct backend functions
5. ✅ Seamless end-to-end user flows

## Test Pyramid

```
                    E2E Tests (User Flows)
                    /                    \
              Integration Tests        API Contract Tests
              /                \
        Service Tests      Component Tests
        /                        \
   Unit Tests                Unit Tests
   (Backend)                (Frontend)
```

## 1. Backend Service Tests

### 1.1 Unit Tests
**Purpose**: Test individual services in isolation

**Services to Test:**
- ✓ `PrismaService` - Database connection
- ✓ `SupabaseService` - Supabase client initialization
- ✓ `AppConfigService` - Configuration loading
- ✓ `WalletsService` - Wallet operations
- ✓ `TransactionsService` - Transaction logic
- ✓ `PricingService` - Price calculations
- ✓ `KycService` - KYC workflow
- ✓ `NomineesService` - Nominee management

**Test File Locations:**
- `backend/services/core-api/src/**/*.spec.ts`

### 1.2 Integration Tests
**Purpose**: Test services working together with real dependencies

**Tests to Implement:**
- ✓ Database CRUD operations
- ✓ Supabase auth token verification
- ✓ Service-to-service communication
- ✓ Transaction atomicity

**Test File Location:**
- `backend/services/core-api/test/integration/`

## 2. Supabase Connection Tests

### 2.1 Database Connection
**Purpose**: Verify Prisma connects to Supabase PostgreSQL

**Tests:**
```typescript
✓ Can connect to database
✓ Can execute queries
✓ Connection pool works
✓ Migrations are applied
✓ Can read/write data
```

### 2.2 Authentication Tests
**Purpose**: Verify Supabase Auth integration

**Tests:**
```typescript
✓ Service role key is valid
✓ Can verify JWT tokens
✓ Can get user from token
✓ Auth guards work correctly
✓ Role-based access control works
```

**Test File Location:**
- `backend/services/core-api/test/integration/supabase.integration.spec.ts`

## 3. API Contract Tests

### 3.1 Endpoint Tests
**Purpose**: Verify API endpoints return correct responses

**Endpoints to Test:**

#### Health & Status
- `GET /health` - Returns 200 with status

#### Authentication
- All protected endpoints require valid JWT
- Returns 401 for missing token
- Returns 403 for invalid token/permissions

#### Wallets API
- `GET /wallets/:userId` - Get user wallets
- Requires auth, ownership validation

#### Transactions API
- `POST /transactions/buy` - Buy gold
- `POST /transactions/sell` - Sell gold
- `GET /transactions?userId=:id` - List transactions

#### Pricing API
- `GET /pricing/current` - Get current price
- `GET /pricing/snapshots` - Price history

#### KYC API
- `POST /kyc/submit` - Submit KYC
- `GET /kyc/:userId` - Get KYC status
- `POST /kyc/admin/status` - Update status (admin only)

#### Nominees API
- `POST /nominees` - Create/update nominee
- `GET /nominees/:userId` - Get nominee

**Test File Location:**
- `backend/services/core-api/test/api/`

## 4. Frontend-Backend Integration Tests

### 4.1 API Client Tests
**Purpose**: Verify frontend API client calls backend correctly

**Tests:**
```typescript
✓ API client configured with correct base URL
✓ Auth token is sent in requests
✓ Request/response interceptors work
✓ Error handling works
✓ Retry logic works
```

### 4.2 Service Integration Tests
**Purpose**: Test frontend services call correct backend endpoints

**Services to Test:**
- `WalletService` → `/wallets/*`
- `TransactionService` → `/transactions/*`
- `PricingService` → `/pricing/*`
- `KycService` → `/kyc/*`
- `NomineeService` → `/nominees/*`

**Test File Location:**
- `frontend/apps/mobile-app/src/services/__tests__/`

## 5. End-to-End Flow Tests

### 5.1 Critical User Flows

#### Flow 1: User Registration & KYC
```
1. User signs up (Supabase Auth)
2. User profile created in database
3. User submits KYC
4. KYC status updates
5. User verified
```

#### Flow 2: Buy Gold
```
1. User logs in
2. Fetches current price
3. Initiates buy transaction
4. Transaction created with pending status
5. Payment processed
6. Wallet balance updates
7. Transaction marked complete
```

#### Flow 3: View Dashboard
```
1. User logs in
2. Fetches wallet summary
3. Fetches transaction history
4. Fetches current gold price
5. Dashboard displays all data
```

#### Flow 4: Set Nominee
```
1. User logs in
2. Navigates to nominee screen
3. Fills nominee form
4. Submits nominee info
5. Nominee saved to backend
6. Success confirmation
```

#### Flow 5: Admin KYC Approval
```
1. Admin logs in
2. Views pending KYC submissions
3. Reviews user documents
4. Approves/rejects KYC
5. User notified of status
```

**Test File Location:**
- `e2e/flows/`

## 6. Test Implementation Plan

### Phase 1: Backend Foundation ✅
- [x] Smoke tests (app starts, endpoints exist)
- [x] Environment configuration
- [x] Test infrastructure (Vitest + SWC)

### Phase 2: Service Integration (CURRENT)
- [ ] Supabase connection test
- [ ] Database CRUD tests
- [ ] Auth token verification tests
- [ ] Service layer tests

### Phase 3: API Contract Tests
- [ ] Endpoint response validation
- [ ] Authentication flow tests
- [ ] Authorization tests
- [ ] Error handling tests

### Phase 4: Frontend Integration
- [ ] API client tests
- [ ] Service integration tests
- [ ] Mock backend for frontend tests

### Phase 5: End-to-End Flows
- [ ] Critical path flows
- [ ] User journey tests
- [ ] Cross-platform tests (iOS/Android)

## 7. Test Data & Fixtures

### Test Users
```typescript
ADMIN_USER: { id: 'admin-test-1', role: 'admin' }
REGULAR_USER: { id: 'user-test-1', role: 'user' }
KYC_PENDING_USER: { id: 'user-test-2', kycStatus: 'PENDING' }
KYC_VERIFIED_USER: { id: 'user-test-3', kycStatus: 'VERIFIED' }
```

### Test Data
- Sample wallets with balances
- Sample transactions (buy/sell)
- Sample pricing data
- Sample KYC submissions
- Sample nominee records

**Location:**
- `backend/services/core-api/test/fixtures/`

## 8. CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    - Unit tests
    - Integration tests
    - API tests
    - Coverage report

  frontend-tests:
    - Component tests
    - Integration tests
    - E2E tests (Detox)

  integration-tests:
    - Start backend
    - Start frontend
    - Run E2E flows
```

## 9. Success Criteria

### Backend Health
- ✅ All services instantiate correctly
- ✅ Database connection successful
- ✅ Supabase auth verification works
- ✅ All endpoints respond correctly
- ✅ Auth guards enforce permissions

### Frontend Health
- ✅ API client configured correctly
- ✅ All services call correct endpoints
- ✅ Auth token passed in requests
- ✅ Error handling works
- ✅ UI updates on API responses

### Integration Health
- ✅ Frontend can authenticate users
- ✅ Frontend can fetch user data
- ✅ Frontend can perform transactions
- ✅ Data flows correctly through entire stack
- ✅ No CORS issues
- ✅ No authentication issues

## 10. Test Commands

```bash
# Backend
cd backend/services/core-api
npm run test           # Unit tests
npm run test:integration  # Integration tests
npm run test:api       # API contract tests
npm run test:cov       # With coverage

# Frontend
cd frontend/apps/mobile-app
npm run test           # Component tests
npm run test:integration  # Integration tests

# E2E
cd e2e
npm run test:e2e       # Full E2E suite
npm run test:flows     # Critical flows only
```

## 11. Next Steps

1. **Immediate**: Implement Supabase integration tests
2. **Short-term**: Add API contract tests
3. **Medium-term**: Frontend integration tests
4. **Long-term**: Full E2E flow tests

## 12. Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **API Tests**: 100% of endpoints tested
- **E2E Tests**: All user flows covered

---

**Status**: Phase 1 Complete ✅ | Phase 2 In Progress 🚧

Last Updated: 2025-01-06
