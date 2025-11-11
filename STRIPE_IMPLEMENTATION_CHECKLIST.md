# Stripe Payment Module Implementation Checklist

## Phase 1: Setup & Configuration

- [ ] **Install Stripe SDK**
  ```bash
  npm install --save stripe
  npm install --save-dev @types/stripe
  ```

- [ ] **Add Environment Variables**
  - [ ] Create `.env` entries: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_ENABLED`
  - [ ] Update `.env.example` with dummy values
  - [ ] Add to Zod schema in `src/config/configuration.ts`

- [ ] **Update .gitignore**
  ```bash
  # Add if not present
  .env
  .env.local
  ```

---

## Phase 2: Core Infrastructure

### Create Integration Module
- [ ] Create `src/integrations/stripe/` directory
- [ ] Create `stripe.service.ts` - Service wrapper for Stripe client
- [ ] Create `stripe.module.ts` - Global module with DI exports

### Create Database Models
- [ ] Add Prisma models to `backend/prisma/schema.prisma`:
  - [ ] `StripeCustomer`
  - [ ] `StripePayment`
  - [ ] `StripePaymentMethod`
  - [ ] `StripeSubscription`
- [ ] Run `npx prisma migrate dev --name add_stripe_models`
- [ ] Verify migration creates tables

---

## Phase 3: Module Structure

### Create Stripe Payments Module Directory
```bash
mkdir -p src/modules/stripe-payments/{dto,entities,services}
```

### Create DTOs
- [ ] `create-payment-intent.dto.ts`
- [ ] `confirm-payment.dto.ts`
- [ ] `create-payment-method.dto.ts`
- [ ] `create-subscription.dto.ts`

### Create Entities
- [ ] `stripe-payment.entity.ts`
- [ ] `stripe-customer.entity.ts`
- [ ] `stripe-payment-method.entity.ts`
- [ ] `stripe-subscription.entity.ts`

### Create Services (in priority order)
1. [ ] `stripe-validation.service.ts` - Input validation
2. [ ] `stripe-error-handler.service.ts` - Error handling
3. [ ] `stripe-customer.service.ts` - Customer management
4. [ ] `stripe-payment-intent.service.ts` - Payment intents
5. [ ] `stripe-payment-method.service.ts` - Card management
6. [ ] `stripe-subscription.service.ts` - Subscriptions
7. [ ] `stripe-webhook.service.ts` - Webhook processing
8. [ ] `stripe-payments.service.ts` - Main orchestrator

### Create Controllers
- [ ] `stripe-payments.controller.ts` - Payment endpoints
- [ ] `stripe-webhook.controller.ts` - Webhook endpoint

### Create Module Definition
- [ ] `stripe-payments.module.ts` - Module with DI configuration

---

## Phase 4: Implementation Details

### Stripe Customer Service
- [ ] Implement `createOrGetCustomer()` method
  - [ ] Check if customer exists in DB
  - [ ] Create in Stripe if new
  - [ ] Store in local DB
  - [ ] Return entity

### Stripe Payment Intent Service
- [ ] Implement `createPaymentIntent()` method
  - [ ] Validate amount (min: 1 AED, max: 1,000,000 AED)
  - [ ] Create customer if needed
  - [ ] Call `stripe.paymentIntents.create()`
  - [ ] Store in DB
  - [ ] Return entity

- [ ] Implement `confirmPayment()` method
  - [ ] Validate payment exists
  - [ ] Call `stripe.paymentIntents.confirm()`
  - [ ] Update status in DB
  - [ ] Handle Stripe errors

- [ ] Implement `getPaymentStatus()` method
  - [ ] Query from DB
  - [ ] Return current status

### Stripe Payment Method Service
- [ ] Implement `addPaymentMethod()` method
- [ ] Implement `listPaymentMethods()` method
- [ ] Implement `deletePaymentMethod()` method

### Stripe Subscription Service
- [ ] Implement `createSubscription()` method
- [ ] Implement `updateSubscription()` method
- [ ] Implement `cancelSubscription()` method

### Stripe Webhook Service
- [ ] Implement `processWebhookEvent()` method
  - [ ] Handle `payment_intent.succeeded`
  - [ ] Handle `payment_intent.payment_failed`
  - [ ] Handle `customer.subscription.created`
  - [ ] Handle `customer.subscription.deleted`
  - [ ] Handle `invoice.payment_succeeded`

### Controllers
- [ ] Route: `POST /api/stripe-payments/payment-intents` - Create payment intent
- [ ] Route: `POST /api/stripe-payments/payment-intents/:id/confirm` - Confirm payment
- [ ] Route: `GET /api/stripe-payments/payment-intents/:id` - Get payment status
- [ ] Route: `POST /api/stripe-payments/payment-methods` - Add card
- [ ] Route: `GET /api/stripe-payments/payment-methods` - List cards
- [ ] Route: `DELETE /api/stripe-payments/payment-methods/:id` - Delete card
- [ ] Route: `POST /api/stripe-payments/subscriptions` - Create subscription
- [ ] Route: `PATCH /api/stripe-payments/subscriptions/:id` - Update subscription
- [ ] Route: `DELETE /api/stripe-payments/subscriptions/:id` - Cancel subscription
- [ ] Route: `POST /api/stripe-webhooks` - Webhook endpoint (no auth guard)

---

## Phase 5: Integration with Existing Modules

### Link to Transactions Module
- [ ] Modify `src/modules/transactions/services/transaction.service.ts`
  - [ ] Add `buyGoldWithStripePayment()` method
  - [ ] Call Stripe payment validation
  - [ ] Create transaction in DB with `metadata.stripePaymentId`
  - [ ] Update wallet balance

### Link to Recurring Plans Module
- [ ] Modify `src/modules/recurring-plans/services/recurring-plan-creation.service.ts`
  - [ ] Add support for `stripeSubscriptionId` in plan creation
  - [ ] Validate subscription exists in Stripe
  - [ ] Store reference in `RecurringSavingsPlan.metadata`

### Link to Pricing Module
- [ ] Ensure pricing service can calculate gold amount from AED amount
- [ ] Export pricing conversion functions for use in payment intent creation

---

## Phase 6: Testing

### Unit Tests
- [ ] Create `test/unit/stripe-payments/` directory
- [ ] Test `stripe-validation.service.ts`
  - [ ] Valid amounts pass validation
  - [ ] Invalid amounts rejected
  - [ ] Invalid emails rejected

- [ ] Test `stripe-customer.service.ts`
  - [ ] Creates new customer in Stripe
  - [ ] Returns existing customer from DB
  - [ ] Stores in DB correctly

- [ ] Test `stripe-payment-intent.service.ts`
  - [ ] Creates payment intent in Stripe
  - [ ] Confirms payment correctly
  - [ ] Handles Stripe errors

### Integration Tests
- [ ] Create `test/integration/` tests
  - [ ] Full payment flow: create intent → confirm → check status
  - [ ] Card management flow
  - [ ] Subscription creation flow

### Smoke Tests
- [ ] Add to `test/smoke/gold-features.smoke.spec.ts`
  - [ ] Stripe module imports without errors
  - [ ] All services can be instantiated

---

## Phase 7: Configuration & Deployment

### Stripe Dashboard Setup
- [ ] Create Stripe account (test mode first)
- [ ] Get API keys (Secret and Publishable)
- [ ] Set up webhooks endpoint URL
- [ ] Subscribe to webhook events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`

### Environment Variables
- [ ] Set `STRIPE_SECRET_KEY` in deployment
- [ ] Set `STRIPE_PUBLISHABLE_KEY` for frontend
- [ ] Set `STRIPE_WEBHOOK_SECRET` for webhook verification
- [ ] Set `STRIPE_ENABLED=true` in production

### Add to AppModule
- [ ] Import `StripeModule` in `src/app/app.module.ts`
- [ ] Import `StripePaymentsModule` in `src/app/app.module.ts`

---

## Phase 8: Frontend Integration (Optional)

### React Native Integration
- [ ] Install Stripe React Native SDK: `npm install @stripe/stripe-react-native`
- [ ] Create `StripePaymentForm` component
- [ ] Handle payment method creation
- [ ] Display payment intent confirmation UI

---

## Phase 9: Documentation & Monitoring

- [ ] Document API endpoints in Swagger/OpenAPI
- [ ] Add error codes and meanings
- [ ] Set up monitoring for webhook failures
- [ ] Set up alerts for payment failures
- [ ] Document Stripe webhook retry logic

---

## Phase 10: Security Checklist

- [ ] Never expose `STRIPE_SECRET_KEY` in frontend
- [ ] Always verify webhook signature
- [ ] Validate amounts before creating payment intent
- [ ] Use HTTPS for webhook endpoint
- [ ] Rate limit payment creation endpoints
- [ ] Sanitize error messages (don't expose Stripe details to client)
- [ ] Use idempotency keys for payment creation (optional but recommended)

---

## Testing with Stripe Sandbox

### Test Cards
- **Visa**: `4242 4242 4242 4242`
- **Visa Decline**: `4000 0000 0000 0002`
- **Amex**: `3782 822463 10005`

### Test Dates & CVV
- Any future date: MM/YY
- Any 3-digit CVC

### Useful Commands
```bash
# Run tests
npm test

# Run tests for stripe module only
npm test -- stripe-payments

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

---

## Deployment Checklist

- [ ] Test with Stripe live keys in staging environment first
- [ ] Verify webhook delivery to production endpoint
- [ ] Monitor transactions for a week before full rollout
- [ ] Set up on-call alerts for webhook processing failures
- [ ] Document rollback procedure if needed
- [ ] Schedule security audit of payment code
- [ ] Verify PCI compliance (though Stripe handles most of it)

---

## Troubleshooting

### Common Issues

**Issue**: `Stripe is not enabled` error
- **Solution**: Set `STRIPE_SECRET_KEY` and `STRIPE_ENABLED=true` in `.env`

**Issue**: Webhook not being received
- **Solution**: 
  1. Verify endpoint URL is correct in Stripe Dashboard
  2. Check `STRIPE_WEBHOOK_SECRET` is correct
  3. Verify endpoint is publicly accessible
  4. Check logs for webhook signature verification errors

**Issue**: Payment intent confirm fails
- **Solution**:
  1. Verify payment method belongs to same customer
  2. Check card is valid (use test cards)
  3. Verify amount is > 0

**Issue**: TypeScript errors with Stripe types
- **Solution**: Ensure `@types/stripe` is installed: `npm install --save-dev @types/stripe`

---

## Next Steps

1. Start with Phase 1: Setup & Configuration
2. Move to Phase 2: Core Infrastructure
3. Implement Phase 3: Module Structure
4. Test incrementally after each phase
5. Integrate with existing modules in Phase 5
6. Deploy to staging for testing
7. Move to production with Phase 10 security checks
