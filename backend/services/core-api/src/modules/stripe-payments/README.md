# Stripe Payment Integration

Enterprise-level Stripe payment integration for the Bulliun Gold Platform.

## Overview

This module provides a complete, production-ready Stripe integration with:
- Payment intent processing
- Payment method management
- Subscription handling
- Webhook event processing with signature verification
- Comprehensive error handling
- Full audit trail

## Architecture

### Specialized Services Pattern

The module follows an enterprise architecture with specialized services:

```
StripePaymentsService (Main Orchestrator)
├── StripeCustomerService - Customer management
├── StripePaymentIntentService - Payment processing
├── StripePaymentMethodService - Payment method management
├── StripeSubscriptionService - Subscription handling
├── StripeWebhookService - Webhook event processing
├── StripeValidationService - Business rule validation
└── StripeErrorHandlerService - Error handling
```

### Database Models

- **StripeCustomer** - Maps users to Stripe customers
- **StripePayment** - Tracks payment intents and status
- **StripePaymentMethod** - Stores saved payment methods
- **StripeSubscription** - Manages recurring subscriptions
- **StripeWebhookEvent** - Audit trail of webhook events (idempotency)

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Stripe Configuration (Optional until keys are ready)
STRIPE_SECRET_KEY=sk_test_...              # Stripe secret key (required for payments)
STRIPE_PUBLISHABLE_KEY=pk_test_...         # Publishable key for frontend
STRIPE_WEBHOOK_SECRET=whsec_...            # Webhook signing secret
```

**Note:** The application will start even without these variables. Stripe features will be disabled until keys are configured.

### 2. Database Migration

Run the Prisma migration to create Stripe tables:

```bash
cd backend/services/core-api
npm run generate  # Generate Prisma types
npm run migrate   # Run migrations (requires DATABASE_URL)
```

Or create a new migration:

```bash
cd backend/prisma
npx prisma migrate dev --name add_stripe_payment_integration
```

### 3. Stripe Dashboard Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create or select a project
3. Get your API keys from **Developers → API Keys**
4. Set up webhook endpoint:
   - URL: `https://your-domain.com/webhooks/stripe`
   - Events to listen to:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_method.attached`
     - `payment_method.detached`
5. Copy the webhook signing secret

## API Endpoints

### Configuration

- `GET /payments/config` - Get Stripe configuration (publishable key, availability)

### Payment Intents

- `POST /payments/create-intent` - Create a payment intent for gold purchase
- `POST /payments/confirm` - Confirm a payment intent
- `GET /payments/history/:userId` - Get payment history

### Payment Methods

- `POST /payments/payment-methods` - Attach a payment method
- `GET /payments/payment-methods/:userId` - List payment methods
- `DELETE /payments/payment-methods/:id` - Remove a payment method

### Subscriptions

- `POST /payments/subscriptions` - Create a subscription
- `POST /payments/subscriptions/cancel` - Cancel a subscription

### Refunds

- `POST /payments/refund` - Refund a payment

### Webhooks

- `POST /webhooks/stripe` - Receive Stripe webhook events (no auth required)

## Usage Examples

### Frontend: Create Payment

```typescript
// 1. Get publishable key
const config = await fetch('/payments/config').then(r => r.json());
const stripe = Stripe(config.publishableKey);

// 2. Create payment intent
const { clientSecret } = await fetch('/payments/create-intent?userId=123', {
  method: 'POST',
  body: JSON.stringify({ amountAED: 1000 }),
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json());

// 3. Confirm payment on frontend
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'Customer Name' }
  }
});

// 4. Backend receives webhook and processes payment
```

### Backend: Process Successful Payment

```typescript
// In StripeWebhookService, payment_intent.succeeded event is handled
// Automatically updates wallet and creates transaction
```

## Security Features

### Webhook Signature Verification

All webhook events are verified using Stripe's signature:

```typescript
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  webhookSecret
);
```

### Idempotency

Webhook events are tracked in the database to prevent duplicate processing:

```typescript
// Check if event was already processed
const existingEvent = await prisma.stripeWebhookEvent.findUnique({
  where: { stripeEventId: event.id }
});
```

### Input Validation

All inputs are validated before processing:

- Amount validation (min/max, integer only)
- Currency validation (supported currencies only)
- Email format validation
- Metadata size validation

### Error Handling

All Stripe errors are caught and transformed to user-friendly messages:

- Card declined → "Your card was declined"
- Insufficient funds → "Insufficient funds"
- Invalid request → "Invalid payment information"
- Network errors → "Connection failed"

## Testing

### Unit Tests

```bash
cd backend/services/core-api
npm test -- stripe
```

### Integration Tests

```bash
# Set test environment variables
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...

# Run integration tests
npm test -- stripe-payments.integration
```

### Stripe Test Cards

Use these test cards in Stripe test mode:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

CVC: Any 3 digits | Expiry: Any future date

## Webhook Testing

### Local Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhooks/stripe

# Test specific event
stripe trigger payment_intent.succeeded
```

## Monitoring

### Webhook Event Status

Check failed webhook events:

```sql
SELECT * FROM "StripeWebhookEvent"
WHERE status = 'FAILED'
ORDER BY "createdAt" DESC;
```

### Retry Failed Events

```typescript
// Automatically retry failed events
await stripeWebhookService.retryFailedEvents(maxRetries = 3);
```

## Production Checklist

- [ ] Set production Stripe keys (starts with `sk_live_`)
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Test webhook delivery (use Stripe Dashboard)
- [ ] Enable HTTPS for webhook endpoint (required)
- [ ] Set up monitoring for failed webhooks
- [ ] Configure rate limiting
- [ ] Set up alerts for payment failures
- [ ] Test refund process
- [ ] Document customer support procedures
- [ ] Set up backup webhook endpoint (optional)

## Troubleshooting

### "Stripe is not configured" error

**Cause:** Missing STRIPE_SECRET_KEY environment variable
**Solution:** Set the STRIPE_SECRET_KEY in your .env file

### Webhook signature verification fails

**Cause:** Using wrong webhook secret or modified body
**Solution:**
1. Verify STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
2. Ensure raw body is used (not parsed JSON)
3. Check webhook endpoint configuration

### Payment intent creation fails

**Cause:** Amount below minimum or invalid currency
**Solution:**
- AED minimum: 2.00 AED (200 fils)
- USD minimum: 0.50 USD (50 cents)

### Webhook events not processing

**Cause:** Database connection issues or failed event processing
**Solution:**
1. Check database connection
2. Review failed events in StripeWebhookEvent table
3. Retry failed events using retry method

## Integration Points

### Transaction Module

Successful payments create transactions:

```typescript
// After payment succeeds, create transaction
await transactionService.create({
  type: 'BUY',
  goldGrams: calculatedGrams,
  fiatAmount: amountAED,
  // ... link to stripe payment
});
```

### Recurring Plans Module

Subscriptions link to recurring savings plans:

```typescript
await stripePayments.createRecurringSubscription(
  userId,
  recurringPlanId,
  priceId
);
```

### Wallet Module

Payments update wallet balances after successful processing.

## Best Practices

1. **Never expose secret key** - Only use publishable key on frontend
2. **Always verify webhooks** - Use signature verification
3. **Handle idempotency** - Track processed events
4. **Validate amounts** - Check min/max before processing
5. **Log everything** - Use structured logging for audit trail
6. **Respond quickly to webhooks** - Process within 5 seconds
7. **Use metadata** - Store contextual information
8. **Handle errors gracefully** - Provide user-friendly messages
9. **Test with test mode** - Use Stripe test cards
10. **Monitor webhook health** - Set up alerts

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Internal Documentation: ARCHITECTURE_ANALYSIS.md

## License

Proprietary - Bulliun Platform
