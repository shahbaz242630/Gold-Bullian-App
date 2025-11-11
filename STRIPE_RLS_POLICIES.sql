-- Stripe RLS (Row Level Security) Policies
-- Created: 2025-11-11
-- Description: Security policies for Stripe payment tables

-- ============================================
-- ENABLE RLS ON ALL STRIPE TABLES
-- ============================================

ALTER TABLE "StripeCustomer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StripePayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StripePaymentMethod" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StripeSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StripeWebhookEvent" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP EXISTING POLICIES (IF ANY)
-- ============================================

DROP POLICY IF EXISTS "Users can view their own Stripe customer" ON "StripeCustomer";
DROP POLICY IF EXISTS "Service role can manage all Stripe customers" ON "StripeCustomer";

DROP POLICY IF EXISTS "Users can view their own payments" ON "StripePayment";
DROP POLICY IF EXISTS "Service role can manage all payments" ON "StripePayment";

DROP POLICY IF EXISTS "Users can view their own payment methods" ON "StripePaymentMethod";
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON "StripePaymentMethod";
DROP POLICY IF EXISTS "Service role can manage all payment methods" ON "StripePaymentMethod";

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON "StripeSubscription";
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON "StripeSubscription";

DROP POLICY IF EXISTS "Only service role can access webhook events" ON "StripeWebhookEvent";

-- ============================================
-- STRIPE CUSTOMER POLICIES
-- ============================================

-- Users can view their own Stripe customer record
CREATE POLICY "Users can view their own Stripe customer"
ON "StripeCustomer"
FOR SELECT
USING (
  auth.uid()::text = "userId"
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Service role can manage all Stripe customers (for API operations)
CREATE POLICY "Service role can manage all Stripe customers"
ON "StripeCustomer"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- STRIPE PAYMENT POLICIES
-- ============================================

-- Users can view their own payment history
CREATE POLICY "Users can view their own payments"
ON "StripePayment"
FOR SELECT
USING (
  auth.uid()::text = "userId"
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Service role can manage all payments (for API and webhook operations)
CREATE POLICY "Service role can manage all payments"
ON "StripePayment"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- STRIPE PAYMENT METHOD POLICIES
-- ============================================

-- Users can view their own payment methods
CREATE POLICY "Users can view their own payment methods"
ON "StripePaymentMethod"
FOR SELECT
USING (
  auth.uid()::text = "userId"
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Users can delete their own payment methods
CREATE POLICY "Users can delete their own payment methods"
ON "StripePaymentMethod"
FOR DELETE
USING (
  auth.uid()::text = "userId"
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Service role can manage all payment methods (for API operations)
CREATE POLICY "Service role can manage all payment methods"
ON "StripePaymentMethod"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- STRIPE SUBSCRIPTION POLICIES
-- ============================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON "StripeSubscription"
FOR SELECT
USING (
  auth.uid()::text = "userId"
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Service role can manage all subscriptions (for API and webhook operations)
CREATE POLICY "Service role can manage all subscriptions"
ON "StripeSubscription"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- STRIPE WEBHOOK EVENT POLICIES
-- ============================================

-- Only service role can access webhook events (sensitive audit trail)
CREATE POLICY "Only service role can access webhook events"
ON "StripeWebhookEvent"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================

-- Grant SELECT on customer and payment data to authenticated users
GRANT SELECT ON "StripeCustomer" TO authenticated;
GRANT SELECT ON "StripePayment" TO authenticated;
GRANT SELECT ON "StripePaymentMethod" TO authenticated;
GRANT SELECT, DELETE ON "StripePaymentMethod" TO authenticated;
GRANT SELECT ON "StripeSubscription" TO authenticated;

-- Service role has full access (already has by default, but explicit for clarity)
GRANT ALL ON "StripeCustomer" TO service_role;
GRANT ALL ON "StripePayment" TO service_role;
GRANT ALL ON "StripePaymentMethod" TO service_role;
GRANT ALL ON "StripeSubscription" TO service_role;
GRANT ALL ON "StripeWebhookEvent" TO service_role;

-- ============================================
-- SUMMARY OF RLS POLICIES
-- ============================================

/*
SECURITY SUMMARY:

1. StripeCustomer:
   - Users can VIEW their own customer record
   - Service role has FULL access

2. StripePayment:
   - Users can VIEW their own payment history
   - Users CANNOT modify payments (security)
   - Service role has FULL access

3. StripePaymentMethod:
   - Users can VIEW their own payment methods
   - Users can DELETE their own payment methods
   - Users CANNOT directly INSERT (must go through API)
   - Service role has FULL access

4. StripeSubscription:
   - Users can VIEW their own subscriptions
   - Users CANNOT modify subscriptions directly
   - Service role has FULL access

5. StripeWebhookEvent:
   - ONLY service role has access
   - Sensitive audit trail
   - Users cannot view webhook events

All policies use auth.uid() to match userId for user access.
Service role (API backend) has full access to all tables for processing.
*/
