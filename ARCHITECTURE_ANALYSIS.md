# Gold-Bullian-App Architecture Analysis & Stripe Payment Module Implementation Guide

## Executive Summary

The Gold-Bullian-App codebase follows a **monorepo architecture** using **NestJS** with an **enterprise modular design pattern**. The application demonstrates excellent separation of concerns with a clear layering strategy: DTOs → Controllers → Main Service (Orchestrator) → Specialized Services → Database Access.

---

## 1. Overall Project Structure

### Monorepo Layout
```
Gold-Bullian-App/
├── backend/
│   ├── services/core-api/          # Main NestJS API service
│   ├── libs/                        # Shared backend libraries
│   └── prisma/                      # Database schema & migrations
├── frontend/
│   ├── apps/consumer/               # React Native/Expo mobile app
│   └── packages/                    # Shared frontend components
├── packages/
│   ├── config/                      # Shared configuration
│   ├── types/                       # Shared TypeScript types
│   ├── tooling/                     # Shared tools
│   └── eslint-config/               # Shared linting rules
└── .github/workflows/               # CI/CD (GitHub Actions)
```

### Technology Stack
- **Framework**: NestJS 10.x (Fastify adapter)
- **Database**: PostgreSQL via Supabase + Prisma ORM
- **Authentication**: Supabase Auth (JWT-based)
- **Testing**: Vitest + @nestjs/testing
- **Configuration**: NestJS Config + Zod validation
- **Security**: Helmet, CORS, Rate Limiting
- **Build Tool**: Turbo (monorepo task orchestration)
- **Code Quality**: ESLint, Prettier, Husky (pre-commit hooks)

---

## 2. Module Architecture Pattern

### Standard Module Structure

Every feature module (Gold Kitty, Kids Wallets, Recurring Plans, etc.) follows this consistent pattern:

```
src/modules/<feature-name>/
├── dto/                                  # Data Transfer Objects (Input validation)
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts
│   └── ...other DTOs
├── entities/                             # Domain Models (Output transformation)
│   ├── <feature>.entity.ts
│   └── ...related entities
├── services/                             # Business Logic
│   ├── <feature>.service.ts             # Main Orchestrator Service
│   ├── <feature>-creation.service.ts    # Specialized: Creation
│   ├── <feature>-validation.service.ts  # Specialized: Validation
│   ├── <feature>-transfer.service.ts    # Specialized: Transfers (if applicable)
│   └── ...other specialized services
├── guards/                               # Authorization (if needed)
│   └── ...guards
├── <feature>.controller.ts              # HTTP Endpoints
├── <feature>.module.ts                  # Module Definition
└── <feature>.service.spec.ts            # Unit Tests
```

### Key Principles

1. **Single Responsibility Principle**: Each service handles ONE specific concern
   - `GoldKittyService` - Orchestration & high-level queries
   - `GoldKittyCreationService` - Creation logic only
   - `GoldKittyValidationService` - Business rule validation
   - `GoldKittyContributionService` - Contribution handling
   - `GoldKittyAllocationService` - Allocation logic
   - `GoldKittyMemberService` - Member management

2. **Layered Architecture**:
   ```
   HTTP Request
        ↓
   Controller (Route handling, request validation)
        ↓
   DTO (Input validation via class-validator)
        ↓
   Main Service (Orchestrates specialized services)
        ↓
   Specialized Services (Domain logic)
        ↓
   Prisma Service (Database access)
        ↓
   Database (PostgreSQL)
        ↓
   Entity (Domain model transformation)
        ↓
   JSON Response
   ```

3. **Dependency Injection**: All services use constructor injection
   - Testable and loosely coupled
   - Dependencies declared in module providers

---

## 3. Configuration Management

### Pattern: Zod-based Validation

**Location**: `src/config/`

```typescript
// configuration.ts - Schema definition with Zod
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3000),
  COOKIE_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type AppConfig = z.infer<typeof envSchema>;

export default registerAs('app', () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Configuration validation error: ...`);
  }
  return parsed.data;
});
```

**Usage**: Inject `AppConfigService` and access with `configService.get<T>(key)`

### Environment Variables Pattern
- All secrets in `.env` (local development) or deployment secrets manager
- `.env.example` committed to repo with dummy values
- Validation happens at application bootstrap
- Graceful failure with descriptive error messages

**For Stripe Integration**, add:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ENABLED=true
```

---

## 4. External Services Integration Pattern

### Pattern: Service Wrapper with Configuration Injection

**Example**: Supabase Integration

```typescript
// supabase.service.ts - Singleton service
@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor(private readonly configService: AppConfigService) {
    const url = this.configService.get('SUPABASE_URL');
    const key = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}

// supabase.module.ts - Global module for DI
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
```

**Pattern Benefits**:
- ✅ Single instance of external service
- ✅ Configuration centralized
- ✅ Testable (mock in tests)
- ✅ Easy to switch implementations

### Existing Payment Service (WadzPay Placeholder)

```typescript
// payment.service.ts - Current implementation
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly wadzpayEnabled: boolean;

  constructor() {
    this.wadzpayEnabled = !!(
      process.env.WADZPAY_API_KEY && 
      process.env.WADZPAY_SECRET
    );
  }

  async processPayment(dto: ProcessPaymentDto): Promise<PaymentResult> {
    if (!this.wadzpayEnabled) {
      this.logger.log('[MOCK] Processing payment: ...');
      return { success: true, paymentId: `mock_${Date.now()}` };
    }
    // TODO: Implement actual WadzPay integration
    throw new Error('WadzPay integration not yet implemented');
  }
}
```

**Key Features**:
- Mock mode when credentials absent
- Logging for debugging
- Clear TODO markers for implementation

---

## 5. Testing Patterns

### Test Structure

```
test/
├── unit/                              # Unit tests (isolated logic)
│   ├── gold-kitty/validation.spec.ts
│   ├── kids-wallets/validation.spec.ts
│   └── recurring-plans/validation.spec.ts
├── integration/                       # Integration tests (with DB)
│   └── pricing.controller.spec.ts
└── smoke/                             # Smoke tests (module imports)
    └── gold-features.smoke.spec.ts
```

### Unit Test Pattern (Using Vitest)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';

describe('GoldKittyValidationService', () => {
  let service: GoldKittyValidationService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      goldKittyMember: {
        count: vi.fn(),
        findFirst: vi.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        GoldKittyValidationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GoldKittyValidationService>(
      GoldKittyValidationService
    );
  });

  describe('validateKittyCreation', () => {
    it('should accept valid inputs', async () => {
      await expect(
        service.validateKittyCreation(5, 100)
      ).resolves.not.toThrow();
    });

    it('should reject too few rounds', async () => {
      await expect(
        service.validateKittyCreation(1, 100)
      ).rejects.toThrow('Total rounds must be between 2 and 12');
    });
  });
});
```

### Smoke Test Pattern

Tests that all modules, services, and controllers can be imported without errors:

```typescript
describe('Gold Features - Smoke Tests', () => {
  it('should import Gold Kitty Module', async () => {
    const { GoldKittyModule } = await import('../../src/modules/gold-kitty/gold-kitty.module');
    expect(GoldKittyModule).toBeDefined();
  });
});
```

---

## 6. Error Handling Patterns

### NestJS Built-in Exceptions

```typescript
import { 
  BadRequestException,      // 400
  UnauthorizedException,    // 401
  NotFoundException,        // 404
  ConflictException,        // 409
  InternalServerErrorException // 500
} from '@nestjs/common';

// Usage in services
if (!parent) {
  throw new NotFoundException(`Parent user ${parentUserId} not found`);
}

if (parent.isKidsAccount) {
  throw new BadRequestException('A kid account cannot create other kid accounts');
}

if (availableBalance < amountGrams) {
  throw new BadRequestException(
    `Insufficient balance. Available: ${availableBalance}g, Required: ${amountGrams}g`
  );
}
```

### Error Handling in Services

```typescript
// Pattern: Validate → Execute in Transaction → Handle Errors
async withdraw(dto: WithdrawPhysicalDto) {
  // 1. Validate all business rules first
  this.validationService.validateCoinSelection(dto.coinSize, dto.quantity);
  this.validationService.validateRecipientDetails(dto.recipientName, dto.recipientPhone);

  // 2. Calculate values
  const totalGoldGrams = this.validationService.calculateTotalGrams(
    dto.coinSize,
    dto.quantity
  );

  // 3. Execute in transaction for atomicity
  const result = await this.prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId_type: { userId: dto.userId, type: WalletType.GOLD } },
    });

    if (!wallet) throw new Error('Wallet not found');

    const availableBalance = Number(wallet.balanceGrams) - Number(wallet.lockedGrams);
    if (availableBalance < totalGoldGrams) {
      throw new Error(
        `Insufficient balance. Available: ${availableBalance}g, Required: ${totalGoldGrams}g`
      );
    }

    // Deduct and create transaction record
    return await tx.wallet.update({ ... });
  });

  return result;
}
```

---

## 7. Logging Mechanisms

### Logger Pattern

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  async processPayment(dto: ProcessPaymentDto): Promise<PaymentResult> {
    try {
      this.logger.log(`Processing payment: ${dto.amountAED} AED for user ${dto.userId}`);
      
      // ... payment logic
      
      this.logger.log('Payment processed successfully');
      return result;
    } catch (error) {
      this.logger.error('Payment processing failed', error.stack);
      throw error;
    }
  }
}
```

### Bootstrap Logging (main.ts)

```typescript
const logger = new Logger('Bootstrap');
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  { bufferLogs: true },
);

logger.log(`Core API running on http://${host}:${port}`);

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to bootstrap application', error.stack);
  process.exit(1);
});
```

---

## 8. Database Integration Patterns

### Prisma Service Pattern

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

### Transaction Pattern

```typescript
// Atomic operations - all or nothing
const result = await this.prisma.$transaction(async (tx) => {
  // Step 1: Create record
  const kitty = await tx.goldKitty.create({ data: { ... } });

  // Step 2: Add member
  await tx.goldKittyMember.create({ data: { ... } });

  // Step 3: Return result
  return kitty;
});

// If any step fails, entire transaction rolls back
```

### Database Models (Key Enums & Relations)

```prisma
enum TransactionType {
  BUY
  SELL
  WITHDRAW_CASH
  WITHDRAW_PHYSICAL
  ADJUSTMENT
}

enum TransactionStatus {
  INITIATED
  PENDING
  COMPLETED
  FAILED
  CANCELLED
  REVERSED
}

enum WalletType {
  GOLD
  FEE
}

model Wallet {
  id            String      @id @default(uuid())
  userId        String
  type          WalletType  @default(GOLD)
  balanceGrams  Decimal     @db.Decimal(18, 8)
  lockedGrams   Decimal     @db.Decimal(18, 8) @default(0)
  
  user          User        @relation(fields: [userId], references: [id])
  @@unique([userId, type])
}

model Transaction {
  id              String            @id @default(uuid())
  userId          String
  walletId        String
  type            TransactionType
  status          TransactionStatus @default(INITIATED)
  goldGrams       Decimal           @db.Decimal(18, 8)
  fiatAmount      Decimal           @db.Decimal(18, 2)
  fiatCurrency    String            @default("AED")
  metadata        Json?
  completedAt     DateTime?
  
  user            User              @relation(fields: [userId], references: [id])
  wallet          Wallet            @relation(fields: [walletId], references: [id])
}
```

---

## 9. Authentication & Authorization Pattern

### Supabase Auth Guard

```typescript
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractToken(request);

    const client = this.supabaseService.getClient();
    const { data, error } = await client.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }

    request.user = this.mapUser(data.user); // Attach user to request
    return true;
  }

  private extractToken(request: FastifyRequest): string {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Missing Bearer authorization header.');
    }
    return authHeader.split(' ')[1];
  }
}
```

### Usage in Controllers

```typescript
@Controller('gold-kitty')
@UseGuards(SupabaseAuthGuard)
export class GoldKittyController {
  @Post()
  async createKitty(@Body() dto: CreateGoldKittyDto) {
    return this.goldKittyService.createKitty(dto);
  }
}
```

---

## 10. Data Transfer Object (DTO) Pattern

### Input Validation (class-validator)

```typescript
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGoldKittyDto {
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10) // Business rule: Minimum monthly amount 10 AED
  @Type(() => Number)
  monthlyAmountAED: number;

  @IsInt()
  @Min(2) // Business rule: At least 2 members
  @Max(12) // Business rule: Maximum 12 rounds
  totalRounds: number;

  @IsOptional()
  metadata?: Record<string, any>;
}
```

### Response Entity (Output Transformation)

```typescript
import { GoldKitty, GoldKittyStatus } from '@prisma/client';

export class GoldKittyEntity {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  monthlyAmountAED: number;
  status: GoldKittyStatus;
  currentRound: number;
  totalRounds: number;
  createdAt: Date;
  updatedAt: Date;

  static fromModel(model: GoldKitty): GoldKittyEntity {
    const entity = new GoldKittyEntity();
    entity.id = model.id;
    entity.ownerId = model.ownerId;
    entity.name = model.name;
    entity.monthlyAmountAED = Number(model.monthlyAmountAED); // Decimal → number
    entity.status = model.status;
    // ... other mappings
    return entity;
  }
}
```

---

## 11. HTTP Request Lifecycle

### Global Pipe Configuration (main.ts)

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,                        // Strip unknown properties
    forbidNonWhitelisted: true,             // Reject unknown properties
    transform: true,                        // Transform to DTO class
    transformOptions: { 
      enableImplicitConversion: true 
    },
  }),
);
```

### Request Flow Example

```
1. HTTP POST /api/gold-kitty
2. Request body: { ownerId: "...", name: "...", monthlyAmountAED: 100, totalRounds: 5 }
3. ValidationPipe:
   - Validates against CreateGoldKittyDto decorators
   - Transforms monthlyAmountAED string → number
   - Strips any extra properties
4. Controller receives validated DTO
5. Controller calls Service
6. Service processes (validates, transforms, persists)
7. Response Entity returned
8. JSON serialized and sent
```

---

## 12. Module Composition Pattern

### How Modules Import Each Other

```typescript
// src/app/app.module.ts - Root module
@Module({
  imports: [
    ConfigModule,           // Global config (must be first)
    DatabaseModule,         // Global database access
    SupabaseModule,         // Global external service
    
    // Feature modules
    UsersModule,
    WalletsModule,
    TransactionsModule,
    PricingModule,
    KycModule,
    NomineesModule,
    AuthModule,
    GoldKittyModule,
    RecurringPlansModule,
    KidsWalletsModule,
    PaymentModule,          // Existing payment module
    HealthModule,
  ],
})
export class AppModule {}
```

### Feature Module Structure

```typescript
@Module({
  imports: [DatabaseModule],              // Depends on DB
  controllers: [GoldKittyController],
  providers: [
    GoldKittyService,                      // Main orchestrator
    GoldKittyCreationService,
    GoldKittyValidationService,
    GoldKittyContributionService,
    GoldKittyAllocationService,
    GoldKittyMemberService,
  ],
  exports: [GoldKittyService],             // Export for other modules
})
export class GoldKittyModule {}
```

---

## 13. Recent Implementation Examples (Reference)

### Gold Kitty (Group Savings - Most Complex)
- **Structure**: 6 specialized services + main orchestrator
- **Database Models**: GoldKitty, GoldKittyMember, GoldKittyContribution, GoldKittyAllocation
- **Key Pattern**: Allocation order validation, round-based contribution tracking
- **Lessons**: Complex domain logic requires multiple specialized services

### Kids Wallets (Family Accounts - Simpler)
- **Structure**: 3 specialized services + main orchestrator
- **Database Models**: Uses User model with flags (isKidsAccount, parentUserId)
- **Key Pattern**: Parent-child relationship validation, age verification, transfer tracking
- **Lessons**: Simple operations can be handled with fewer services

### Recurring Plans (Scheduled Execution - Advanced)
- **Structure**: 6 specialized services for scheduling, execution, progress tracking
- **Database Models**: RecurringSavingsPlan, RecurringPlanExecution
- **Key Pattern**: Scheduling service (TODO: implement with @nestjs/schedule)
- **Lessons**: Integration with job scheduling requires dedicated service

### Physical Withdrawal (Complex Transactions)
- **Structure**: Validation service + main service
- **Key Pattern**: Detailed validation, coin selection, multiple delivery methods
- **Lessons**: Rich metadata in transactions for fulfillment details

---

## STRIPE PAYMENT MODULE IMPLEMENTATION GUIDE

### 1. Module Structure (Recommended)

```
src/modules/stripe-payments/
├── dto/
│   ├── create-payment-intent.dto.ts
│   ├── confirm-payment.dto.ts
│   ├── create-payment-method.dto.ts
│   ├── process-one-time-payment.dto.ts
│   └── create-subscription.dto.ts
├── entities/
│   ├── stripe-payment.entity.ts
│   ├── stripe-customer.entity.ts
│   ├── stripe-payment-method.entity.ts
│   └── stripe-subscription.entity.ts
├── services/
│   ├── stripe-payments.service.ts              # Main orchestrator
│   ├── stripe-customer.service.ts              # Customer management
│   ├── stripe-payment-intent.service.ts        # Payment intent handling
│   ├── stripe-payment-method.service.ts        # Card/payment method management
│   ├── stripe-subscription.service.ts          # Subscription handling
│   ├── stripe-webhook.service.ts               # Webhook processing
│   ├── stripe-validation.service.ts            # Validation logic
│   └── stripe-error-handler.service.ts         # Error handling & logging
├── guards/
│   └── stripe-webhook.guard.ts                 # Webhook verification
├── stripe-payments.controller.ts
├── stripe-webhook.controller.ts
├── stripe-payments.module.ts
└── tests/
    └── stripe-payments.service.spec.ts
```

### 2. Configuration Setup

**Step 1**: Update `.env.example` and `.env`:
```bash
# .env.example
STRIPE_SECRET_KEY=sk_test_51234567890abc
STRIPE_PUBLISHABLE_KEY=pk_test_123456789abc
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef
STRIPE_ENABLED=true
STRIPE_API_VERSION=2023-10-16
```

**Step 2**: Extend configuration schema:
```typescript
// src/config/configuration.ts
const envSchema = z.object({
  // ... existing config
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
  STRIPE_API_VERSION: z.string().default('2023-10-16'),
});
```

### 3. Stripe Service Wrapper

```typescript
// src/integrations/stripe/stripe.service.ts
import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe;
  private readonly stripeEnabled: boolean;

  constructor(private readonly configService: AppConfigService) {
    const secretKey = this.configService.get('STRIPE_SECRET_KEY');
    this.stripeEnabled = !!secretKey && this.configService.get('STRIPE_ENABLED');

    if (this.stripeEnabled) {
      this.client = new Stripe(secretKey, {
        apiVersion: this.configService.get('STRIPE_API_VERSION'),
        typescript: true,
      });
      this.logger.log('Stripe client initialized');
    } else {
      this.logger.warn('Stripe is not configured. Running in mock mode.');
    }
  }

  getClient(): Stripe {
    if (!this.stripeEnabled) {
      throw new Error('Stripe is not enabled. Add STRIPE_SECRET_KEY to .env');
    }
    return this.client;
  }

  isEnabled(): boolean {
    return this.stripeEnabled;
  }
}

// src/integrations/stripe/stripe.module.ts
@Global()
@Module({
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
```

### 4. Stripe Payment Module Structure

```typescript
// src/modules/stripe-payments/stripe-payments.module.ts
@Module({
  imports: [DatabaseModule, StripeModule],
  controllers: [StripePaymentsController, StripeWebhookController],
  providers: [
    // Main orchestrator
    StripePaymentsService,

    // Specialized services
    StripeCustomerService,
    StripePaymentIntentService,
    StripePaymentMethodService,
    StripeSubscriptionService,
    StripeWebhookService,
    StripeValidationService,
    StripeErrorHandlerService,
  ],
  exports: [StripePaymentsService],
})
export class StripePaymentsModule {}
```

### 5. Main Orchestrator Service

```typescript
// src/modules/stripe-payments/services/stripe-payments.service.ts
@Injectable()
export class StripePaymentsService {
  private readonly logger = new Logger(StripePaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly customerService: StripeCustomerService,
    private readonly paymentIntentService: StripePaymentIntentService,
    private readonly paymentMethodService: StripePaymentMethodService,
    private readonly subscriptionService: StripeSubscriptionService,
    private readonly validationService: StripeValidationService,
    private readonly errorHandlerService: StripeErrorHandlerService,
  ) {}

  // ==================== Customer Management ====================

  async createOrGetCustomer(userId: string, email: string, name?: string) {
    return this.customerService.createOrGetCustomer(userId, email, name);
  }

  // ==================== One-Time Payments ====================

  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    return this.paymentIntentService.createPaymentIntent(dto);
  }

  async confirmPayment(dto: ConfirmPaymentDto) {
    return this.paymentIntentService.confirmPayment(dto);
  }

  async getPaymentStatus(paymentIntentId: string) {
    return this.paymentIntentService.getPaymentStatus(paymentIntentId);
  }

  // ==================== Payment Methods ====================

  async addPaymentMethod(userId: string, token: string) {
    return this.paymentMethodService.addPaymentMethod(userId, token);
  }

  async listPaymentMethods(userId: string) {
    return this.paymentMethodService.listPaymentMethods(userId);
  }

  async deletePaymentMethod(userId: string, paymentMethodId: string) {
    return this.paymentMethodService.deletePaymentMethod(userId, paymentMethodId);
  }

  // ==================== Subscriptions ====================

  async createSubscription(dto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(dto);
  }

  async updateSubscription(subscriptionId: string, updates: any) {
    return this.subscriptionService.updateSubscription(subscriptionId, updates);
  }

  async cancelSubscription(subscriptionId: string) {
    return this.subscriptionService.cancelSubscription(subscriptionId);
  }

  // ==================== Webhooks ====================

  async handleWebhook(signature: string, body: Buffer) {
    const event = this.stripeService.getClient().webhooks.constructEvent(
      body,
      signature,
      this.configService.get('STRIPE_WEBHOOK_SECRET')
    );
    return this.webhookService.processWebhookEvent(event);
  }
}
```

### 6. Specialized Services

```typescript
// src/modules/stripe-payments/services/stripe-customer.service.ts
@Injectable()
export class StripeCustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly validationService: StripeValidationService,
  ) {}

  async createOrGetCustomer(
    userId: string, 
    email: string, 
    name?: string
  ): Promise<StripeCustomerEntity> {
    // Check if customer already exists in our DB
    let stripeCustomer = await this.prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    if (stripeCustomer) {
      return StripeCustomerEntity.fromModel(stripeCustomer);
    }

    // Validate input
    this.validationService.validateEmail(email);

    // Create in Stripe
    const customer = await this.stripeService.getClient().customers.create({
      email,
      name,
      metadata: { userId },
    });

    // Store in our DB
    stripeCustomer = await this.prisma.stripeCustomer.create({
      data: {
        userId,
        stripeCustomerId: customer.id,
        email: customer.email,
        metadata: customer.metadata as Prisma.InputJsonValue,
      },
    });

    return StripeCustomerEntity.fromModel(stripeCustomer);
  }
}

// src/modules/stripe-payments/services/stripe-payment-intent.service.ts
@Injectable()
export class StripePaymentIntentService {
  async createPaymentIntent(
    dto: CreatePaymentIntentDto
  ): Promise<StripePaymentEntity> {
    // Validate
    this.validationService.validateAmount(dto.amountAED);
    
    const customer = await this.customerService.createOrGetCustomer(
      dto.userId, 
      dto.email
    );

    // Create payment intent in Stripe
    const paymentIntent = await this.stripeService.getClient().paymentIntents.create({
      amount: Math.round(dto.amountAED * 100), // Convert to cents
      currency: 'aed',
      customer: customer.stripeCustomerId,
      metadata: {
        userId: dto.userId,
        goldGrams: dto.goldGrams?.toString(),
        ...dto.metadata,
      },
    });

    // Store in DB for tracking
    const payment = await this.prisma.stripePayment.create({
      data: {
        userId: dto.userId,
        stripePaymentIntentId: paymentIntent.id,
        amountAED: new Prisma.Decimal(dto.amountAED),
        currency: 'AED',
        status: paymentIntent.status,
        metadata: paymentIntent.metadata as Prisma.InputJsonValue,
      },
    });

    return StripePaymentEntity.fromModel(payment);
  }

  async confirmPayment(dto: ConfirmPaymentDto): Promise<StripePaymentEntity> {
    // Get payment from DB
    const payment = await this.prisma.stripePayment.findUnique({
      where: { stripePaymentIntentId: dto.paymentIntentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    try {
      // Confirm with Stripe
      const confirmedIntent = await this.stripeService
        .getClient()
        .paymentIntents.confirm(dto.paymentIntentId, {
          payment_method: dto.paymentMethodId,
        });

      // Update in DB
      const updated = await this.prisma.stripePayment.update({
        where: { id: payment.id },
        data: {
          status: confirmedIntent.status,
          completedAt: confirmedIntent.status === 'succeeded' ? new Date() : null,
        },
      });

      return StripePaymentEntity.fromModel(updated);
    } catch (error) {
      this.errorHandlerService.handle(error, payment.id);
      throw error;
    }
  }
}

// src/modules/stripe-payments/services/stripe-subscription.service.ts
@Injectable()
export class StripeSubscriptionService {
  async createSubscription(dto: CreateSubscriptionDto) {
    // Get or create customer
    const customer = await this.customerService.createOrGetCustomer(
      dto.userId,
      dto.email
    );

    // Get or add payment method
    const paymentMethod = await this.paymentMethodService.ensurePaymentMethod(
      customer.stripeCustomerId,
      dto.paymentMethodId
    );

    // Create subscription in Stripe
    const subscription = await this.stripeService.getClient().subscriptions.create({
      customer: customer.stripeCustomerId,
      items: [{ price: dto.stripePriceId }],
      default_payment_method: paymentMethod.id,
      metadata: {
        userId: dto.userId,
        planName: dto.planName,
        ...dto.metadata,
      },
    });

    // Store in DB for tracking
    const dbSubscription = await this.prisma.stripeSubscription.create({
      data: {
        userId: dto.userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: dto.stripePriceId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        metadata: subscription.metadata as Prisma.InputJsonValue,
      },
    });

    return StripeSubscriptionEntity.fromModel(dbSubscription);
  }
}
```

### 7. Controllers

```typescript
// src/modules/stripe-payments/stripe-payments.controller.ts
@Controller('stripe-payments')
@UseGuards(SupabaseAuthGuard)
export class StripePaymentsController {
  constructor(private readonly paymentsService: StripePaymentsService) {}

  // ==================== Payment Intents ====================

  @Post('payment-intents')
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(dto);
  }

  @Post('payment-intents/:id/confirm')
  async confirmPayment(
    @Param('id') id: string,
    @Body() dto: ConfirmPaymentDto
  ) {
    return this.paymentsService.confirmPayment({
      ...dto,
      paymentIntentId: id,
    });
  }

  @Get('payment-intents/:id')
  async getPaymentStatus(@Param('id') id: string) {
    return this.paymentsService.getPaymentStatus(id);
  }

  // ==================== Payment Methods ====================

  @Post('payment-methods')
  async addPaymentMethod(@Body() dto: CreatePaymentMethodDto, @Request() req: any) {
    return this.paymentsService.addPaymentMethod(req.user.id, dto.token);
  }

  @Get('payment-methods')
  async listPaymentMethods(@Request() req: any) {
    return this.paymentsService.listPaymentMethods(req.user.id);
  }

  @Delete('payment-methods/:id')
  async deletePaymentMethod(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.paymentsService.deletePaymentMethod(req.user.id, id);
  }

  // ==================== Subscriptions ====================

  @Post('subscriptions')
  async createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.paymentsService.createSubscription(dto);
  }

  @Patch('subscriptions/:id')
  async updateSubscription(@Param('id') id: string, @Body() updates: any) {
    return this.paymentsService.updateSubscription(id, updates);
  }

  @Delete('subscriptions/:id')
  async cancelSubscription(@Param('id') id: string) {
    return this.paymentsService.cancelSubscription(id);
  }
}

// src/modules/stripe-payments/stripe-webhook.controller.ts
@Controller('stripe-webhooks')
export class StripeWebhookController {
  constructor(private readonly paymentsService: StripePaymentsService) {}

  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: any,
  ) {
    const rawBody = request.rawBody || request.body;
    return this.paymentsService.handleWebhook(signature, rawBody);
  }
}
```

### 8. DTOs

```typescript
// src/modules/stripe-payments/dto/create-payment-intent.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEmail, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentIntentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEmail()
  email: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1) // Minimum 1 AED
  @Type(() => Number)
  amountAED: number;

  @IsNumber({ maxDecimalPlaces: 8 })
  @IsOptional()
  @Type(() => Number)
  goldGrams?: number; // For gold purchases

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  stripePriceId: string; // From Stripe Products

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @IsString()
  @IsOptional()
  planName?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
```

### 9. Entities

```typescript
// src/modules/stripe-payments/entities/stripe-payment.entity.ts
export class StripePaymentEntity {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  amountAED: number;
  currency: string;
  status: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  static fromModel(model: StripePayment): StripePaymentEntity {
    const entity = new StripePaymentEntity();
    entity.id = model.id;
    entity.userId = model.userId;
    entity.stripePaymentIntentId = model.stripePaymentIntentId;
    entity.amountAED = Number(model.amountAED);
    entity.currency = model.currency;
    entity.status = model.status;
    entity.completedAt = model.completedAt;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    return entity;
  }
}
```

### 10. Database Models (Prisma)

```prisma
// Add to backend/prisma/schema.prisma

enum StripePaymentStatus {
  REQUIRES_PAYMENT_METHOD
  REQUIRES_CONFIRMATION
  REQUIRES_ACTION
  PROCESSING
  SUCCEEDED
  FAILED
  CANCELLED
}

enum StripeSubscriptionStatus {
  INCOMPLETE
  INCOMPLETE_EXPIRED
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
}

model StripeCustomer {
  id                    String          @id @default(uuid())
  userId                String          @unique
  stripeCustomerId      String          @unique
  email                 String?
  metadata              Json?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  user                  User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments              StripePayment[]
  subscriptions         StripeSubscription[]
  paymentMethods        StripePaymentMethod[]

  @@index([userId])
  @@index([stripeCustomerId])
}

model StripePayment {
  id                    String          @id @default(uuid())
  userId                String
  stripePaymentIntentId String          @unique
  stripeCustId          String?
  amountAED             Decimal         @db.Decimal(18, 2)
  currency              String          @default("AED")
  status                String          // From Stripe: succeeded, requires_action, etc.
  failureReason         String?
  metadata              Json?
  completedAt           DateTime?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  user                  User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  customer              StripeCustomer? @relation(fields: [stripeCustId], references: [stripeCustomerId])

  @@index([userId])
  @@index([status])
  @@index([stripePaymentIntentId])
}

model StripePaymentMethod {
  id                    String          @id @default(uuid())
  userId                String
  stripePaymentMethodId String          @unique
  stripeCustId          String
  type                  String          // card, wallet, etc.
  brand                 String?         // visa, mastercard, etc.
  last4                 String?
  isDefault             Boolean         @default(false)
  expMonth              Int?
  expYear               Int?
  metadata              Json?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  user                  User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  customer              StripeCustomer  @relation(fields: [stripeCustId], references: [stripeCustomerId], onDelete: Cascade)

  @@index([userId])
  @@index([stripeCustId])
  @@index([stripePaymentMethodId])
}

model StripeSubscription {
  id                    String          @id @default(uuid())
  userId                String
  stripeSubscriptionId  String          @unique
  stripePriceId         String
  status                String          // trialing, active, canceled, etc.
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  canceledAt            DateTime?
  metadata              Json?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  user                  User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([stripeSubscriptionId])
}
```

### 11. Validation Service

```typescript
// src/modules/stripe-payments/services/stripe-validation.service.ts
@Injectable()
export class StripeValidationService {
  validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email address');
    }
  }

  validateAmount(amountAED: number): void {
    if (amountAED < 1) {
      throw new BadRequestException('Amount must be at least 1 AED');
    }
    if (amountAED > 1000000) {
      throw new BadRequestException('Amount exceeds maximum limit');
    }
  }

  validateCurrency(currency: string): void {
    if (currency.toUpperCase() !== 'AED') {
      throw new BadRequestException('Only AED currency is supported');
    }
  }
}
```

### 12. Webhook Handling

```typescript
// src/modules/stripe-payments/services/stripe-webhook.service.ts
@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async processWebhookEvent(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          return this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
        
        case 'payment_intent.payment_failed':
          return this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent
          );
        
        case 'customer.subscription.created':
          return this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription
          );
        
        case 'customer.subscription.deleted':
          return this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
          );
        
        case 'invoice.payment_succeeded':
          return this.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice
          );
        
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.stripePayment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) return;

    // Update payment status
    await this.prisma.stripePayment.update({
      where: { id: payment.id },
      data: {
        status: 'succeeded',
        completedAt: new Date(),
      },
    });

    // TODO: Create gold transaction, update wallet, etc.
    // Example for gold purchase:
    // const goldGrams = paymentIntent.metadata?.goldGrams;
    // if (goldGrams) {
    //   await this.transactionsService.buyGold({
    //     userId: payment.userId,
    //     goldGrams: Number(goldGrams),
    //     paymentId: payment.id,
    //   });
    // }

    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.stripePayment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) return;

    await this.prisma.stripePayment.update({
      where: { id: payment.id },
      data: {
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message,
      },
    });

    this.logger.warn(`Payment failed: ${paymentIntent.id}`);
  }

  // ... other webhook handlers
}
```

### 13. Error Handling Service

```typescript
// src/modules/stripe-payments/services/stripe-error-handler.service.ts
@Injectable()
export class StripeErrorHandlerService {
  private readonly logger = new Logger(StripeErrorHandlerService.name);

  handle(error: any, context: string): void {
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      this.logger.error(`Authentication error in ${context}: ${error.message}`);
      throw new InternalServerErrorException('Stripe authentication failed');
    }

    if (error instanceof Stripe.errors.StripeCardError) {
      this.logger.warn(`Card error in ${context}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      this.logger.error(`Invalid request to Stripe in ${context}: ${error.message}`);
      throw new BadRequestException('Invalid payment parameters');
    }

    this.logger.error(`Stripe error in ${context}:`, error);
    throw new InternalServerErrorException('Payment processing failed');
  }
}
```

### 14. Integration with Existing Modules

#### Link to Recurring Plans:
```typescript
// src/modules/recurring-plans/services/recurring-plan-execution.service.ts
// When executing a recurring plan with Stripe:

async executeRecurringPayment(plan: RecurringSavingsPlan) {
  const subscription = await this.prisma.stripeSubscription.findUnique({
    where: { id: plan.stripeSubscriptionId },
  });

  if (!subscription) {
    throw new Error('Stripe subscription not linked to this plan');
  }

  // Payment is automatically handled by Stripe webhooks
  // Just record the execution attempt
  const execution = await this.prisma.recurringPlanExecution.create({
    data: {
      planId: plan.id,
      scheduledDate: plan.nextExecutionDate,
      status: 'PENDING',
    },
  });

  return execution;
}
```

#### Link to Gold Purchase:
```typescript
// src/modules/transactions/services/transaction.service.ts
// When gold is purchased via Stripe payment:

async buyGoldWithStripePayment(
  userId: string,
  goldGrams: number,
  stripePaymentId: string,
) {
  // Validate Stripe payment is completed
  const stripePayment = await this.prisma.stripePayment.findUnique({
    where: { id: stripePaymentId },
  });

  if (!stripePayment || stripePayment.status !== 'succeeded') {
    throw new BadRequestException('Payment not completed');
  }

  // Create gold transaction in atomic transaction
  return this.prisma.$transaction(async (tx) => {
    // Update wallet
    const wallet = await tx.wallet.update({
      where: {
        userId_type: { userId, type: WalletType.GOLD },
      },
      data: {
        balanceGrams: {
          increment: new Prisma.Decimal(goldGrams),
        },
      },
    });

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: TransactionType.BUY,
        status: TransactionStatus.COMPLETED,
        goldGrams: new Prisma.Decimal(goldGrams),
        fiatAmount: stripePayment.amountAED,
        fiatCurrency: 'AED',
        referenceCode: `STRIPE_${stripePayment.id}`,
        metadata: {
          stripePaymentId: stripePayment.id,
          source: 'stripe',
        } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    return transaction;
  });
}
```

### 15. Testing Strategy

```typescript
// src/modules/stripe-payments/stripe-payments.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { StripePaymentsService } from './stripe-payments.service';
import { PrismaService } from '../../../database/prisma.service';
import { StripeService } from '../../../integrations/stripe/stripe.service';

describe('StripePaymentsService', () => {
  let service: StripePaymentsService;
  let mockPrisma: any;
  let mockStripe: any;

  beforeEach(async () => {
    mockPrisma = {
      stripeCustomer: { findUnique: vi.fn(), create: vi.fn() },
      stripePayment: { create: vi.fn(), update: vi.fn() },
    };

    mockStripe = {
      customers: { create: vi.fn() },
      paymentIntents: { create: vi.fn(), confirm: vi.fn() },
      webhooks: { constructEvent: vi.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripePaymentsService,
        StripeCustomerService,
        StripePaymentIntentService,
        StripeValidationService,
        StripeErrorHandlerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StripeService, useValue: { getClient: () => mockStripe } },
      ],
    }).compile();

    service = module.get<StripePaymentsService>(StripePaymentsService);
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent', async () => {
      // ... test implementation
    });

    it('should handle validation errors', async () => {
      // ... test implementation
    });
  });
});
```

---

## Summary: Key Takeaways for Stripe Implementation

1. **Follow Module Pattern**: Create `stripe-payments` module with same structure as Gold Kitty, Kids Wallets
2. **Specialized Services**: Separate concerns (customer, payment intent, subscription, webhook)
3. **Configuration**: Use Zod validation, environment variables, injectable config service
4. **Database**: Add Stripe models to Prisma schema, store customer & payment records
5. **Error Handling**: Use NestJS exceptions (BadRequestException, etc.), handle Stripe errors specifically
6. **Webhooks**: Implement verification & processing for async events from Stripe
7. **Integration**: Link with existing Transactions, Recurring Plans modules
8. **Testing**: Unit tests with mocked Prisma & Stripe, integration tests with real API
9. **Logging**: Use NestJS Logger for debugging and monitoring
10. **Mock Mode**: Support fallback when Stripe not configured (like existing PaymentService)

This approach ensures seamless integration with existing architecture while maintaining code quality, testability, and maintainability.
