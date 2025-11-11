-- Stripe Payment Integration Migration
-- Created: 2025-11-11
-- Description: Add Stripe payment processing tables and enums

-- ============================================
-- CREATE ENUMS
-- ============================================

CREATE TYPE "StripePaymentStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'REQUIRES_ACTION',
  'REQUIRES_PAYMENT_METHOD',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUNDED'
);

CREATE TYPE "StripePaymentMethodType" AS ENUM (
  'CARD',
  'BANK_ACCOUNT',
  'WALLET'
);

CREATE TYPE "StripeSubscriptionStatus" AS ENUM (
  'ACTIVE',
  'PAST_DUE',
  'UNPAID',
  'CANCELED',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'TRIALING',
  'PAUSED'
);

CREATE TYPE "StripeWebhookEventStatus" AS ENUM (
  'PENDING',
  'PROCESSED',
  'FAILED',
  'IGNORED'
);

-- ============================================
-- CREATE TABLES
-- ============================================

-- Stripe Customer mapping
CREATE TABLE "StripeCustomer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeCustomer_pkey" PRIMARY KEY ("id")
);

-- Stripe Payment tracking
CREATE TABLE "StripePayment" (
    "id" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "status" "StripePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethodId" TEXT,
    "receiptUrl" TEXT,
    "failureMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripePayment_pkey" PRIMARY KEY ("id")
);

-- Stripe Payment Methods
CREATE TABLE "StripePaymentMethod" (
    "id" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripePaymentMethodId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "StripePaymentMethodType" NOT NULL DEFAULT 'CARD',
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "cardExpMonth" INTEGER,
    "cardExpYear" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "billingDetails" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripePaymentMethod_pkey" PRIMARY KEY ("id")
);

-- Stripe Subscriptions
CREATE TABLE "StripeSubscription" (
    "id" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recurringPlanId" TEXT,
    "productId" TEXT,
    "priceId" TEXT,
    "status" "StripeSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeSubscription_pkey" PRIMARY KEY ("id")
);

-- Stripe Webhook Events (for idempotency and audit trail)
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "StripeWebhookEventStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- CREATE UNIQUE CONSTRAINTS
-- ============================================

CREATE UNIQUE INDEX "StripeCustomer_userId_key" ON "StripeCustomer"("userId");
CREATE UNIQUE INDEX "StripeCustomer_stripeCustomerId_key" ON "StripeCustomer"("stripeCustomerId");
CREATE UNIQUE INDEX "StripePayment_stripePaymentIntentId_key" ON "StripePayment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "StripePayment_transactionId_key" ON "StripePayment"("transactionId");
CREATE UNIQUE INDEX "StripePaymentMethod_stripePaymentMethodId_key" ON "StripePaymentMethod"("stripePaymentMethodId");
CREATE UNIQUE INDEX "StripeSubscription_stripeSubscriptionId_key" ON "StripeSubscription"("stripeSubscriptionId");
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent"("stripeEventId");

-- ============================================
-- CREATE INDEXES
-- ============================================

-- StripeCustomer indexes
CREATE INDEX "StripeCustomer_userId_idx" ON "StripeCustomer"("userId");
CREATE INDEX "StripeCustomer_stripeCustomerId_idx" ON "StripeCustomer"("stripeCustomerId");

-- StripePayment indexes
CREATE INDEX "StripePayment_stripeCustomerId_idx" ON "StripePayment"("stripeCustomerId");
CREATE INDEX "StripePayment_userId_idx" ON "StripePayment"("userId");
CREATE INDEX "StripePayment_status_idx" ON "StripePayment"("status");
CREATE INDEX "StripePayment_stripePaymentIntentId_idx" ON "StripePayment"("stripePaymentIntentId");

-- StripePaymentMethod indexes
CREATE INDEX "StripePaymentMethod_stripeCustomerId_idx" ON "StripePaymentMethod"("stripeCustomerId");
CREATE INDEX "StripePaymentMethod_userId_idx" ON "StripePaymentMethod"("userId");
CREATE INDEX "StripePaymentMethod_stripePaymentMethodId_idx" ON "StripePaymentMethod"("stripePaymentMethodId");

-- StripeSubscription indexes
CREATE INDEX "StripeSubscription_stripeCustomerId_idx" ON "StripeSubscription"("stripeCustomerId");
CREATE INDEX "StripeSubscription_userId_idx" ON "StripeSubscription"("userId");
CREATE INDEX "StripeSubscription_status_idx" ON "StripeSubscription"("status");
CREATE INDEX "StripeSubscription_stripeSubscriptionId_idx" ON "StripeSubscription"("stripeSubscriptionId");

-- StripeWebhookEvent indexes
CREATE INDEX "StripeWebhookEvent_stripeEventId_idx" ON "StripeWebhookEvent"("stripeEventId");
CREATE INDEX "StripeWebhookEvent_type_idx" ON "StripeWebhookEvent"("type");
CREATE INDEX "StripeWebhookEvent_status_idx" ON "StripeWebhookEvent"("status");
CREATE INDEX "StripeWebhookEvent_createdAt_idx" ON "StripeWebhookEvent"("createdAt");

-- ============================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================

ALTER TABLE "StripeCustomer" ADD CONSTRAINT "StripeCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StripePayment" ADD CONSTRAINT "StripePayment_stripeCustomerId_fkey" FOREIGN KEY ("stripeCustomerId") REFERENCES "StripeCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StripePayment" ADD CONSTRAINT "StripePayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StripePaymentMethod" ADD CONSTRAINT "StripePaymentMethod_stripeCustomerId_fkey" FOREIGN KEY ("stripeCustomerId") REFERENCES "StripeCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StripeSubscription" ADD CONSTRAINT "StripeSubscription_stripeCustomerId_fkey" FOREIGN KEY ("stripeCustomerId") REFERENCES "StripeCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
