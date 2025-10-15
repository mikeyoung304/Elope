# Secrets Matrix

This document lists every environment variable used in the Elope API, organized by feature. Use the `pnpm doctor` script to validate your configuration.

---

## Core Configuration

### `ADAPTERS_PRESET`
- **Mode**: Both (mock/real)
- **Required**: Yes (defaults to `mock`)
- **Used in**: `apps/api/src/core/config.ts:11`, `apps/api/src/di.ts:51`
- **Purpose**: Controls whether to use mock or real adapters (database, payments, email, calendar)
- **Valid values**: `mock`, `real`

### `NODE_ENV`
- **Mode**: Both
- **Required**: No (defaults to development)
- **Used in**: `apps/api/src/core/logger.ts:7`
- **Purpose**: Sets the Node.js environment (affects logging behavior)
- **Valid values**: `development`, `production`

### `LOG_LEVEL`
- **Mode**: Both
- **Required**: No (defaults to `info`)
- **Used in**: `apps/api/src/core/logger.ts:10`
- **Purpose**: Controls log verbosity
- **Valid values**: `trace`, `debug`, `info`, `warn`, `error`, `fatal`

### `API_PORT`
- **Mode**: Both
- **Required**: No (defaults to `3001`)
- **Used in**: `apps/api/src/core/config.ts:12`, `apps/api/src/index.ts`
- **Purpose**: Port for the API server to listen on
- **Example**: `3001`

### `CORS_ORIGIN`
- **Mode**: Both
- **Required**: No (defaults to `http://localhost:5173`)
- **Used in**: `apps/api/src/core/config.ts:13`, `apps/api/src/index.ts`
- **Purpose**: Allowed origin for CORS requests (typically the frontend URL)
- **Example**: `http://localhost:5173`, `https://yourdomain.com`

---

## Authentication

### `JWT_SECRET`
- **Mode**: Both (mock/real)
- **Required**: ✅ **Yes**
- **Used in**: `apps/api/src/core/config.ts:14`, `apps/api/src/di.ts:69,148`
- **Purpose**: Secret key for signing and verifying JWT tokens for admin authentication
- **Example**: `your-super-secret-jwt-key-change-me-in-production`
- **Security**: MUST be changed from default in production; use a strong random string

---

## Database (PostgreSQL + Prisma)

### `DATABASE_URL`
- **Mode**: Real only
- **Required**: ✅ **Yes in real mode** (mock mode uses in-memory storage)
- **Used in**: `apps/api/src/core/config.ts:16`, `apps/api/src/di.ts:93-94`
- **Purpose**: PostgreSQL connection string for Prisma
- **Example**: `postgresql://username:password@localhost:5432/elope_dev?schema=public`
- **Format**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`
- **Error if missing (real mode)**: `DATABASE_URL required for real adapters mode`

---

## Payment Processing (Stripe)

### `STRIPE_SECRET_KEY`
- **Mode**: Real only
- **Required**: ✅ **Yes in real mode**
- **Used in**: `apps/api/src/core/config.ts:17`, `apps/api/src/di.ts:109-110`, `apps/api/src/adapters/stripe.adapter.ts`
- **Purpose**: Stripe API secret key for creating checkout sessions and processing payments
- **Example**: `sk_test_51ABC...` (test) or `sk_live_51ABC...` (production)
- **Where to get**: [Stripe Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys)
- **Error if missing (real mode)**: `STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET required for real adapters mode`

### `STRIPE_WEBHOOK_SECRET`
- **Mode**: Real only
- **Required**: ✅ **Yes in real mode**
- **Used in**: `apps/api/src/core/config.ts:18`, `apps/api/src/di.ts:109-110`, `apps/api/src/adapters/stripe.adapter.ts`
- **Purpose**: Webhook signing secret for verifying Stripe webhook events
- **Example**: `whsec_ABC123...`
- **Where to get**: [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks) (create endpoint for `/api/v1/webhooks/stripe`)
- **Error if missing (real mode)**: `STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET required for real adapters mode`

### `STRIPE_SUCCESS_URL`
- **Mode**: Real only
- **Required**: No (defaults to `http://localhost:5173/success`)
- **Used in**: `apps/api/src/core/config.ts:19`, `apps/api/src/di.ts:116`
- **Purpose**: URL to redirect customers after successful payment
- **Example**: `http://localhost:5173/success`, `https://yourdomain.com/booking-confirmed`

### `STRIPE_CANCEL_URL`
- **Mode**: Real only
- **Required**: No (defaults to `http://localhost:5173`)
- **Used in**: `apps/api/src/core/config.ts:20`, `apps/api/src/di.ts:117`
- **Purpose**: URL to redirect customers if they cancel payment
- **Example**: `http://localhost:5173`, `https://yourdomain.com/booking-cancelled`

---

## Email (Postmark)

### `POSTMARK_SERVER_TOKEN`
- **Mode**: Real only
- **Required**: ⚠️ **No** (falls back to file-sink in `tmp/emails/`)
- **Used in**: `apps/api/src/core/config.ts:21`, `apps/api/src/di.ts:122`, `apps/api/src/adapters/postmark.adapter.ts`
- **Purpose**: Postmark API token for sending transactional emails
- **Example**: `abc123-your-postmark-token-here`
- **Where to get**: [Postmark → API Tokens](https://account.postmarkapp.com/api_tokens)
- **Fallback behavior**: If missing, emails are written to `tmp/emails/*.json` (file-sink mode)

### `POSTMARK_FROM_EMAIL`
- **Mode**: Real only
- **Required**: No (defaults to `bookings@example.com`)
- **Used in**: `apps/api/src/core/config.ts:22`, `apps/api/src/di.ts:123`, `apps/api/src/adapters/postmark.adapter.ts`
- **Purpose**: The "From" email address for booking confirmation emails
- **Example**: `bookings@yourdomain.com`
- **Note**: Must be a verified sender in Postmark

---

## Calendar Integration (Google Calendar)

### `GOOGLE_CALENDAR_ID`
- **Mode**: Real only
- **Required**: ⚠️ **No** (falls back to mock calendar with all dates available)
- **Used in**: `apps/api/src/core/config.ts:23`, `apps/api/src/di.ts:128`, `apps/api/src/adapters/gcal.adapter.ts`
- **Purpose**: The Google Calendar ID to check for availability (freeBusy API)
- **Example**: `your-email@gmail.com` or `c_abc123@group.calendar.google.com`
- **Setup**: Share your calendar with the service account email
- **Fallback behavior**: If missing, all dates are marked as available (mock calendar)

### `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
- **Mode**: Real only
- **Required**: ⚠️ **No** (falls back to mock calendar)
- **Used in**: `apps/api/src/core/config.ts:24`, `apps/api/src/di.ts:128`, `apps/api/src/adapters/gcal.adapter.ts`
- **Purpose**: Base64-encoded service account credentials JSON for Google Calendar API
- **Example**: `eyJhbGciOiJSUzI1NiIsInR5cC...` (base64)
- **Where to get**: [Google Cloud Console → IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
- **Encoding**: `base64 -i service-account.json | tr -d '\n'`
- **Fallback behavior**: If missing, all dates are marked as available (mock calendar)

---

## Quick Reference

### Mock Mode (`ADAPTERS_PRESET=mock`)
**Required:**
- `JWT_SECRET` ✅

**Optional:**
- `API_PORT`, `CORS_ORIGIN`, `NODE_ENV`, `LOG_LEVEL`

**Ignored:**
- All database, Stripe, Postmark, and Google Calendar variables

---

### Real Mode (`ADAPTERS_PRESET=real`)
**Required:**
- `JWT_SECRET` ✅
- `DATABASE_URL` ✅
- `STRIPE_SECRET_KEY` ✅
- `STRIPE_WEBHOOK_SECRET` ✅

**Optional (with graceful fallbacks):**
- `POSTMARK_SERVER_TOKEN` (→ file-sink)
- `POSTMARK_FROM_EMAIL`
- `GOOGLE_CALENDAR_ID` (→ mock calendar)
- `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` (→ mock calendar)
- `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`
- `API_PORT`, `CORS_ORIGIN`, `NODE_ENV`, `LOG_LEVEL`

---

## Validation

Run the doctor script to validate your environment configuration:

```bash
pnpm doctor
```

The script will:
- Check if `.env` exists
- Validate required variables per mode
- Warn about missing optional variables
- Exit with code 1 if critical variables are missing in real mode
- Exit with code 0 in mock mode (warnings only)

See `RUNBOOK.md` for example output and troubleshooting.
