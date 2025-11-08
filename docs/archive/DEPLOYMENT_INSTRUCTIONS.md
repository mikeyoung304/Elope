# ⚠️ SECURITY NOTICE ⚠️
**This document contains example secret values. Rotate before production deployment.**
See REMEDIATION_PLAN.md Phase 1 for secret rotation procedures.

---

# Phase 2B Deployment Instructions

**Date:** 2025-10-29
**Version:** Phase 2B - Webhook Error Handling & Race Condition Prevention
**Status:** Ready for deployment

---

## Prerequisites

- [ ] Code changes have been reviewed and committed
- [ ] All tests passing (129/129 ✅)
- [ ] TypeScript compilation successful ✅
- [ ] Backup of production database created

---

## Deployment Steps

### Step 1: Deploy Database Migration

**Due to Supabase CLI connection limitation, this migration must be run manually via Supabase SQL Editor.**

1. Navigate to [Supabase SQL Editor](https://supabase.com/dashboard/project/gpyvdknhmevcfdbgtqir/sql)

2. Copy and paste the contents of `server/prisma/migrations/01_add_webhook_events.sql`:

```sql
-- Migration: Add WebhookEvent table for webhook idempotency and dead letter queue
-- Date: 2025-10-29
-- Phase: 2B - Webhook Error Handling

-- Create WebhookStatus enum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'DUPLICATE');

-- Create WebhookEvent table
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "rawPayload" TEXT NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- Create unique index on eventId (prevent duplicate webhook processing)
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

-- Create index on eventId for fast lookups
CREATE INDEX "WebhookEvent_eventId_idx" ON "WebhookEvent"("eventId");

-- Create index on status for filtering
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");
```

3. Click "Run" to execute the migration

4. Verify the table was created:
```sql
SELECT * FROM "WebhookEvent" LIMIT 1;
```

Expected result: Empty table with correct schema

---

### Step 2: Rotate Secrets (Critical Security Step)

**⚠️ IMPORTANT: The JWT_SECRET has been rotated in `.env`. All users will need to re-authenticate.**

#### 2a. Update Production Environment Variables

Update your production environment with the new JWT_SECRET:

```bash
# From server/.env (line 4)
JWT_SECRET=3d3fa3a52c3ffd50eab162e1222e4f953aede6a9e8732bf4a03a0b836f0bff24
```

#### 2b. Rotate Stripe Keys (Recommended)

Follow instructions in `SECRETS_ROTATION.md` (Section 2: Stripe Secret Key & Webhook Secret)

**Summary:**
1. Login to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Create new restricted key with minimal permissions
3. Update webhook endpoint at [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
4. Update production `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
5. Revoke old keys

**Estimated time:** 15-20 minutes

---

### Step 3: Deploy Application Code

#### 3a. Build Application

```bash
# From project root
npm run build
```

#### 3b. Deploy to Production

Follow your standard deployment process (e.g., Vercel, Railway, Render, etc.)

Ensure environment variables are updated:
- `JWT_SECRET` - New value from Step 2a
- `STRIPE_SECRET_KEY` - New value from Step 2b (if rotated)
- `STRIPE_WEBHOOK_SECRET` - New value from Step 2b (if rotated)

---

### Step 4: Verify Deployment

#### 4a. Database Verification

```sql
-- Check WebhookEvent table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'WebhookEvent';

-- Check WebhookStatus enum exists
SELECT unnest(enum_range(NULL::\"WebhookStatus\"));
```

Expected: Table and enum exist with correct structure

#### 4b. Application Health Check

```bash
# Check API is running
curl https://your-api-domain.com/health

# Expected: 200 OK
```

#### 4c. Authentication Test

```bash
# Test login with admin credentials (will receive new JWT)
curl -X POST https://your-api-domain.com/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin"}'

# Expected: {"token": "eyJ..."}
```

**Note:** All existing JWT tokens are now invalid due to JWT_SECRET rotation

#### 4d. Webhook Test

**Option 1: Stripe CLI (Local Testing)**
```bash
stripe listen --forward-to https://your-api-domain.com/api/v1/webhooks/stripe
stripe trigger checkout.session.completed
```

**Option 2: Stripe Dashboard (Production Testing)**
1. Create a test checkout session via API
2. Complete the checkout
3. Verify webhook was received and processed
4. Check Supabase database for WebhookEvent record:
```sql
SELECT * FROM "WebhookEvent" ORDER BY "createdAt" DESC LIMIT 5;
```

Expected: 1 record with status = 'PROCESSED'

---

### Step 5: Monitor for Issues

#### 5a. Check Webhook Processing

Monitor for failed webhooks:
```sql
SELECT * FROM "WebhookEvent" WHERE status = 'FAILED';
```

If any failures occur, investigate `lastError` column for details.

#### 5b. Check Application Logs

Monitor logs for:
- `BookingLockTimeoutError` - Indicates concurrent booking attempts (expected under load)
- `WebhookProcessingError` - Indicates webhook processing failures (investigate immediately)
- `BookingConflictError` - Indicates successful double-booking prevention

#### 5c. Monitor Metrics

- Webhook success rate: `COUNT(status='PROCESSED') / COUNT(*)`
- Duplicate webhook rate: `COUNT(status='DUPLICATE') / COUNT(*)`
- Failed webhook rate: `COUNT(status='FAILED') / COUNT(*)`

Target: >99% success rate, <1% duplicates, <1% failures

---

## Rollback Plan

If critical issues occur after deployment:

### Rollback Step 1: Revert Application Code

Deploy previous version of application code (Phase 2A)

### Rollback Step 2: Revert JWT_SECRET (Optional)

If authentication issues occur:
```bash
# Revert to old JWT_SECRET in production environment
JWT_SECRET=68fa0f2690e33a51659ce4a431826afaf3aa9848765bb4092d518dca0f4a7005
```

**Note:** This will invalidate all JWTs issued since rotation

### Rollback Step 3: Database Migration (Not Required)

The WebhookEvent table can remain in the database - it will be unused by Phase 2A code.

**Only drop if absolutely necessary:**
```sql
DROP TABLE "WebhookEvent";
DROP TYPE "WebhookStatus";
```

---

## Post-Deployment Checklist

- [ ] WebhookEvent table created in Supabase
- [ ] JWT_SECRET rotated in production
- [ ] Stripe keys rotated (if applicable)
- [ ] Application deployed successfully
- [ ] Health check passes
- [ ] Authentication works with new JWT_SECRET
- [ ] Test webhook processed successfully
- [ ] Monitoring configured for webhook failures
- [ ] Team notified of JWT_SECRET rotation (users must re-login)

---

## Support Resources

- **Documentation:** See `DECISIONS.md` for architecture decisions
- **Troubleshooting:** See `SECRETS_ROTATION.md` for secret management
- **Supabase Dashboard:** https://supabase.com/dashboard/project/gpyvdknhmevcfdbgtqir
- **Stripe Dashboard:** https://dashboard.stripe.com/test/webhooks

---

## Success Metrics

After 24 hours of production use:

- ✅ 0 double-bookings (race conditions prevented)
- ✅ >99% webhook success rate (idempotency working)
- ✅ <100ms webhook processing time (p95)
- ✅ 0 BookingLockTimeoutError under normal load
- ✅ All duplicate webhooks handled gracefully (200 OK response)

---

**Deployment Date:** _____________________
**Deployed By:** _____________________
**Version Tag:** `v1.0.0-phase2b-complete`
**Production Readiness:** 95%
