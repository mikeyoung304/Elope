# Runbook

## Local dev

```bash
# Mock mode default
pnpm -C apps/api run dev
pnpm -C apps/web run dev
```

### Dev simulators (mock mode only)

- `POST /v1/dev/simulate-checkout-completed` — mark a session as paid
- `GET /v1/dev/debug-state` — inspect in‑memory data

## Switching to real mode

1. Set `ADAPTERS_PRESET=real` and fill real envs.
2. Run Prisma migrations and seed admin.
3. Configure Stripe webhook → `/v1/webhooks/stripe`.
4. Verify Postmark domain and sender.
5. Share Google Calendar with service account.

## Stripe Local Testing

### Prerequisites

1. **Get Stripe test keys:**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy your **Secret key** (starts with `sk_test_`)
   - Add it to `apps/api/.env`:
     ```
     STRIPE_SECRET_KEY=sk_test_xxx
     ```

2. **Install Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   # or download from https://stripe.com/docs/stripe-cli
   ```

3. **Login to Stripe:**
   ```bash
   stripe login
   ```

### Testing Webhooks Locally

1. **Start the webhook forwarder:**
   ```bash
   stripe listen --forward-to localhost:3001/v1/webhooks/stripe
   ```

   This will output a webhook signing secret like `whsec_xxx...`

2. **Update your `.env`:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxx...
   ```

3. **Restart the API:**
   ```bash
   pnpm -C apps/api run dev:real
   ```

4. **Test a checkout:**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future date, any CVC, any ZIP
   - Complete the payment flow
   - The webhook will be forwarded to your local API

5. **Verify the booking:**
   ```bash
   curl http://localhost:3001/v1/admin/bookings
   ```

### Stripe CLI Webhook Testing

You can also trigger test webhooks manually:

```bash
# Simulate a successful checkout
stripe trigger checkout.session.completed
```

**Note:** Manual triggers won't include real booking metadata. Use the full checkout flow for realistic testing.

## Email (Postmark)

### Setup for Production

1. **Sign up for Postmark:**
   - Create an account at https://postmarkapp.com
   - Create a new server or use the default one

2. **Verify your sender domain:**
   - Go to **Sender Signatures** in your Postmark dashboard
   - Add and verify your sending email address or domain
   - Follow DNS verification steps (SPF, DKIM, Return-Path)

3. **Get your Server API Token:**
   - Go to your server settings
   - Copy the **Server API Token** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - Add it to `apps/api/.env`:
     ```
     POSTMARK_SERVER_TOKEN=your-token-here
     POSTMARK_FROM_EMAIL=bookings@yourdomain.com
     ```

### Dev Mode - File Sink Fallback

**In real mode without Postmark credentials**, emails are written to `apps/api/tmp/emails/` as `.eml` files:

```bash
# Leave POSTMARK_SERVER_TOKEN empty for file-sink mode
POSTMARK_SERVER_TOKEN=
POSTMARK_FROM_EMAIL=bookings@example.com
```

Each email is saved with a timestamp and recipient filename. Check the API logs for file paths.

### Testing Email Flow

1. **With file sink (no token):**
   - Complete a booking in real mode
   - Check `apps/api/tmp/emails/` for the confirmation email file
   - View the raw email content

2. **With Postmark (token set):**
   - Complete a booking
   - Check your Postmark dashboard → Activity for sent emails
   - Verify delivery to the customer email

## Production checks

### Health endpoints

**Liveness check** — Always returns 200 OK:
```bash
curl http://localhost:3001/health
# {"ok":true}
```

**Readiness check** — Verifies configuration:
```bash
# Mock mode — always ready
curl http://localhost:3001/ready
# {"ok":true,"mode":"mock"}

# Real mode — checks required env vars
curl http://localhost:3001/ready
# Success: {"ok":true,"mode":"real"}
# Missing keys: {"ok":false,"missing":["DATABASE_URL","STRIPE_SECRET_KEY",...]}
```

If `/ready` returns `ok: false`, check your `.env` file and ensure all required keys are set:
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `POSTMARK_FROM_EMAIL` (POSTMARK_SERVER_TOKEN optional; uses file sink if empty)
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`

### Logging & Monitoring

- **Logging:** pino JSON with `requestId` on every request
- **Monitoring:** attach Sentry or log drain
