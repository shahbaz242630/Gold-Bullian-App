-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('ACCOUNT_CREATED', 'KYC_REQUIRED', 'KYC_SUBMITTED', 'FUNDING_ADDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL', 'WITHDRAW_CASH', 'WITHDRAW_PHYSICAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('INITIATED', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('GOLD', 'FEE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseUid" TEXT NOT NULL,
    "email" CITEXT,
    "phoneNumber" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "countryCode" TEXT,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'ACCOUNT_CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nominee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "countryCode" TEXT,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nominee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WalletType" NOT NULL DEFAULT 'GOLD',
    "balanceGrams" DECIMAL(18,8) NOT NULL,
    "lockedGrams" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'INITIATED',
    "goldGrams" DECIMAL(18,8) NOT NULL,
    "fiatAmount" DECIMAL(18,2) NOT NULL,
    "fiatCurrency" TEXT NOT NULL DEFAULT 'AED',
    "feeAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "feeCurrency" TEXT NOT NULL DEFAULT 'AED',
    "referenceCode" TEXT NOT NULL,
    "metadata" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoldPriceSnapshot" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "buyPrice" DECIMAL(18,3) NOT NULL,
    "sellPrice" DECIMAL(18,3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoldPriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceOverride" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "buyPrice" DECIMAL(18,3) NOT NULL,
    "sellPrice" DECIMAL(18,3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUid_key" ON "User"("supabaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_supabaseUid_idx" ON "User"("supabaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "KycProfile_userId_key" ON "KycProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KycProfile_providerRef_key" ON "KycProfile"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "Nominee_userId_key" ON "Nominee"("userId");

-- CreateIndex
CREATE INDEX "wallet_user_type_idx" ON "Wallet"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_user_type_unique" ON "Wallet"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_referenceCode_key" ON "Transaction"("referenceCode");

-- CreateIndex
CREATE INDEX "transaction_user_created_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "transaction_reference_idx" ON "Transaction"("referenceCode");

-- CreateIndex
CREATE INDEX "gold_price_effective_idx" ON "GoldPriceSnapshot"("effectiveAt");

-- AddForeignKey
ALTER TABLE "KycProfile" ADD CONSTRAINT "KycProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nominee" ADD CONSTRAINT "Nominee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
