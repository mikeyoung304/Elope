---
description: Stripe webhook and testing commands
tags: [stripe, webhooks, payments, testing]
---

# Stripe Operations

Commands for testing Stripe payments, webhooks, and connected accounts.

## Prerequisites:

1. Install Stripe CLI:

   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:

   ```bash
   stripe login
   ```

3. Set environment variables in `server/.env`:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (from CLI or dashboard)

## Common Operations:

### 1. Start Webhook Listener:

```bash
stripe listen --forward-to localhost:3001/v1/webhooks/stripe
```

This will:

- Listen for webhook events from Stripe
- Forward them to your local server
- Display the webhook signing secret (add to .env)
- Show real-time webhook events in the terminal

### 2. Trigger Test Events:

#### Payment Success:

```bash
stripe trigger payment_intent.succeeded
```

#### Payment Failed:

```bash
stripe trigger payment_intent.payment_failed
```

#### Checkout Session Completed:

```bash
stripe trigger checkout.session.completed
```

#### Customer Created:

```bash
stripe trigger customer.created
```

#### Subscription Events:

```bash
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

### 3. Show Recent Webhook Events:

```bash
# List recent events
stripe events list --limit 10

# Get details of specific event
stripe events retrieve <event_id>
```

### 4. Test Complete Payment Flow:

```bash
# 1. Create a checkout session (from your app or API)
curl -X POST http://localhost:3001/v1/checkout/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "your-tenant-id",
    "packageId": "package-id",
    "customerEmail": "test@example.com"
  }'

# 2. Get the checkout URL from response and open in browser
# 3. Use test card: 4242 4242 4242 4242
# 4. Any expiry date in the future, any CVC
# 5. Watch webhook listener for checkout.session.completed event
```

### 5. Test Card Numbers:

| Card Number         | Description                         |
| ------------------- | ----------------------------------- |
| 4242 4242 4242 4242 | Successful payment                  |
| 4000 0000 0000 0002 | Card declined                       |
| 4000 0000 0000 9995 | Insufficient funds                  |
| 4000 0027 6000 3184 | Requires authentication (3D Secure) |

## Advanced Operations:

### Test Connected Accounts (Platform Commission):

```bash
# Create a connected account
stripe accounts create --type=express \
  --country=US \
  --email=vendor@example.com

# List connected accounts
stripe accounts list --limit 5

# Get account details
stripe accounts retrieve <account_id>
```

### Test Refunds:

```bash
# List recent payments
stripe payment_intents list --limit 5

# Create a refund
stripe refunds create --payment-intent=<payment_intent_id>

# Partial refund (amount in cents)
stripe refunds create \
  --payment-intent=<payment_intent_id> \
  --amount=1000
```

### Monitor Logs:

```bash
# Tail Stripe API logs in real-time
stripe logs tail

# Filter by event type
stripe logs tail --filter-event-type=payment_intent.succeeded
```

## Webhook Testing:

### 1. Local Development (using CLI):

```bash
# Terminal 1: Start your API server
npm run dev:api

# Terminal 2: Start webhook listener
stripe listen --forward-to localhost:3001/v1/webhooks/stripe

# Terminal 3: Trigger events
stripe trigger checkout.session.completed
```

### 2. Test Webhook Signature Verification:

```bash
# Send a test webhook with custom payload
stripe trigger checkout.session.completed --override checkout.session:metadata.tenantId=test-tenant
```

### 3. Debug Webhook Issues:

```bash
# Check recent webhook attempts in Stripe Dashboard
# Or list webhook endpoints:
stripe webhook-endpoints list

# Get webhook endpoint details:
stripe webhook-endpoints retrieve <endpoint_id>
```

## Integration Testing:

### Full Booking Flow Test:

```bash
# 1. Create a tenant (via API or Prisma Studio)
# 2. Create a package for the tenant
# 3. Create checkout session:
curl -X POST http://localhost:3001/v1/checkout/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-id",
    "packageId": "package-id",
    "customerName": "Test Customer",
    "customerEmail": "test@example.com"
  }'

# 4. Complete payment in browser
# 5. Verify webhook received (check webhook listener output)
# 6. Verify booking created in database (Prisma Studio)
# 7. Check commission calculation is correct
```

## Troubleshooting:

### Webhook not receiving events:

1. Check webhook listener is running
2. Verify `STRIPE_WEBHOOK_SECRET` in .env
3. Check API server is running on correct port
4. Look for errors in webhook listener output

### Payment fails:

1. Check `STRIPE_SECRET_KEY` is set correctly
2. Verify you're using test mode keys (start with `sk_test_`)
3. Check Stripe Dashboard for error details
4. Review server logs for Stripe API errors

### Commission not calculated:

1. Verify tenant has `commissionPercent` set
2. Check commission.service.ts logs
3. Verify booking record has commission fields populated
4. Check Stripe Dashboard for `application_fee_amount`
