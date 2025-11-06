-- =====================================================================
-- Migration: Add Multi-Tenancy Support
-- Description: Transforms single-tenant app into multi-tenant platform
-- Date: 2025-01-06
-- =====================================================================

-- -----------------------------------------------------------------------
-- Step 1: Create Tenant table
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Tenant" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "apiKeyPublic" TEXT NOT NULL UNIQUE,
  "apiKeySecret" TEXT NOT NULL,
  "commissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
  "branding" JSONB NOT NULL DEFAULT '{}',
  "stripeAccountId" TEXT UNIQUE,
  "stripeOnboarded" BOOLEAN NOT NULL DEFAULT false,
  "secrets" JSONB NOT NULL DEFAULT '{}',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on Tenant
CREATE INDEX IF NOT EXISTS "Tenant_slug_idx" ON "Tenant"("slug");
CREATE INDEX IF NOT EXISTS "Tenant_apiKeyPublic_idx" ON "Tenant"("apiKeyPublic");
CREATE INDEX IF NOT EXISTS "Tenant_isActive_idx" ON "Tenant"("isActive");

-- -----------------------------------------------------------------------
-- Step 2: Create default tenant for existing data (legacy migration)
-- -----------------------------------------------------------------------
DO $$
DECLARE
  default_tenant_id TEXT := 'tenant_default_legacy';
  random_suffix TEXT := substr(md5(random()::text), 1, 16);
BEGIN
  INSERT INTO "Tenant" (
    "id",
    "slug",
    "name",
    "apiKeyPublic",
    "apiKeySecret",
    "commissionPercent",
    "branding",
    "isActive",
    "createdAt",
    "updatedAt"
  ) VALUES (
    default_tenant_id,
    'elope',
    'Elope (Legacy)',
    'pk_live_elope_' || random_suffix,
    'sk_live_elope_' || substr(md5(random()::text), 1, 32), -- Will be hashed by app
    10.0,
    '{"primaryColor": "#7C3AED", "logo": null}'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO NOTHING; -- Idempotent
END $$;

-- -----------------------------------------------------------------------
-- Step 3: Add tenantId columns to existing tables (nullable initially)
-- -----------------------------------------------------------------------

-- Add to Package
ALTER TABLE "Package"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Add to AddOn
ALTER TABLE "AddOn"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Add to Booking
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Add commission fields to Booking
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "commissionAmount" INTEGER DEFAULT 0;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "commissionPercent" DECIMAL(5,2) DEFAULT 0;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT UNIQUE;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);

-- Add to BlackoutDate
ALTER TABLE "BlackoutDate"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Add to WebhookEvent
ALTER TABLE "WebhookEvent"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- -----------------------------------------------------------------------
-- Step 4: Populate tenantId for existing records with default tenant
-- -----------------------------------------------------------------------

UPDATE "Package"
SET "tenantId" = 'tenant_default_legacy'
WHERE "tenantId" IS NULL;

UPDATE "AddOn"
SET "tenantId" = 'tenant_default_legacy'
WHERE "tenantId" IS NULL;

UPDATE "Booking"
SET "tenantId" = 'tenant_default_legacy'
WHERE "tenantId" IS NULL;

UPDATE "BlackoutDate"
SET "tenantId" = 'tenant_default_legacy'
WHERE "tenantId" IS NULL;

UPDATE "WebhookEvent"
SET "tenantId" = 'tenant_default_legacy'
WHERE "tenantId" IS NULL;

-- -----------------------------------------------------------------------
-- Step 5: Make tenantId NOT NULL and set defaults
-- -----------------------------------------------------------------------

ALTER TABLE "Package"
  ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "AddOn"
  ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "Booking"
  ALTER COLUMN "tenantId" SET NOT NULL,
  ALTER COLUMN "commissionAmount" SET NOT NULL,
  ALTER COLUMN "commissionPercent" SET NOT NULL;

ALTER TABLE "BlackoutDate"
  ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "WebhookEvent"
  ALTER COLUMN "tenantId" SET NOT NULL;

-- -----------------------------------------------------------------------
-- Step 6: Drop old unique constraints (replaced by composite constraints)
-- -----------------------------------------------------------------------

-- Drop Package.slug unique constraint
ALTER TABLE "Package"
  DROP CONSTRAINT IF EXISTS "Package_slug_key";

-- Drop AddOn.slug unique constraint
ALTER TABLE "AddOn"
  DROP CONSTRAINT IF EXISTS "AddOn_slug_key";

-- Drop Booking.date unique constraint (critical for multi-tenant)
ALTER TABLE "Booking"
  DROP CONSTRAINT IF EXISTS "Booking_date_key";

-- Drop BlackoutDate.date unique constraint
ALTER TABLE "BlackoutDate"
  DROP CONSTRAINT IF EXISTS "BlackoutDate_date_key";

-- -----------------------------------------------------------------------
-- Step 7: Add composite unique constraints
-- -----------------------------------------------------------------------

-- Package: tenantId + slug must be unique
ALTER TABLE "Package"
  ADD CONSTRAINT "Package_tenantId_slug_key"
  UNIQUE ("tenantId", "slug");

-- AddOn: tenantId + slug must be unique
ALTER TABLE "AddOn"
  ADD CONSTRAINT "AddOn_tenantId_slug_key"
  UNIQUE ("tenantId", "slug");

-- Booking: tenantId + date must be unique (one booking per date per tenant)
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_tenantId_date_key"
  UNIQUE ("tenantId", "date");

-- BlackoutDate: tenantId + date must be unique
ALTER TABLE "BlackoutDate"
  ADD CONSTRAINT "BlackoutDate_tenantId_date_key"
  UNIQUE ("tenantId", "date");

-- -----------------------------------------------------------------------
-- Step 8: Add foreign key constraints
-- -----------------------------------------------------------------------

ALTER TABLE "Package"
  ADD CONSTRAINT "Package_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE;

ALTER TABLE "AddOn"
  ADD CONSTRAINT "AddOn_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE;

ALTER TABLE "BlackoutDate"
  ADD CONSTRAINT "BlackoutDate_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE;

ALTER TABLE "WebhookEvent"
  ADD CONSTRAINT "WebhookEvent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE;

-- -----------------------------------------------------------------------
-- Step 9: Add performance indexes for tenant-scoped queries
-- -----------------------------------------------------------------------

-- Package indexes
CREATE INDEX IF NOT EXISTS "Package_tenantId_idx" ON "Package"("tenantId");
CREATE INDEX IF NOT EXISTS "Package_tenantId_active_idx" ON "Package"("tenantId", "active");

-- AddOn indexes
CREATE INDEX IF NOT EXISTS "AddOn_tenantId_idx" ON "AddOn"("tenantId");
CREATE INDEX IF NOT EXISTS "AddOn_tenantId_active_idx" ON "AddOn"("tenantId", "active");

-- Booking indexes
CREATE INDEX IF NOT EXISTS "Booking_tenantId_idx" ON "Booking"("tenantId");
CREATE INDEX IF NOT EXISTS "Booking_tenantId_status_idx" ON "Booking"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Booking_tenantId_date_idx" ON "Booking"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "Booking_tenantId_status_date_idx" ON "Booking"("tenantId", "status", "date");
CREATE INDEX IF NOT EXISTS "Booking_stripePaymentIntentId_idx" ON "Booking"("stripePaymentIntentId");

-- BlackoutDate indexes
CREATE INDEX IF NOT EXISTS "BlackoutDate_tenantId_idx" ON "BlackoutDate"("tenantId");
CREATE INDEX IF NOT EXISTS "BlackoutDate_tenantId_date_idx" ON "BlackoutDate"("tenantId", "date");

-- WebhookEvent indexes
CREATE INDEX IF NOT EXISTS "WebhookEvent_tenantId_idx" ON "WebhookEvent"("tenantId");
CREATE INDEX IF NOT EXISTS "WebhookEvent_tenantId_status_idx" ON "WebhookEvent"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "WebhookEvent_tenantId_createdAt_idx" ON "WebhookEvent"("tenantId", "createdAt");

-- -----------------------------------------------------------------------
-- Step 10: Verification queries (informational)
-- -----------------------------------------------------------------------

-- Verify tenant count
DO $$
DECLARE
  tenant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tenant_count FROM "Tenant";
  RAISE NOTICE 'Tenants created: %', tenant_count;
END $$;

-- Verify data migration
DO $$
DECLARE
  orphan_packages INTEGER;
  orphan_bookings INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_packages FROM "Package" WHERE "tenantId" IS NULL;
  SELECT COUNT(*) INTO orphan_bookings FROM "Booking" WHERE "tenantId" IS NULL;

  IF orphan_packages > 0 OR orphan_bookings > 0 THEN
    RAISE WARNING 'Found orphaned records: packages=%, bookings=%', orphan_packages, orphan_bookings;
  ELSE
    RAISE NOTICE 'All records successfully migrated to tenants';
  END IF;
END $$;

-- =====================================================================
-- Migration Complete
-- =====================================================================
-- The database now supports multi-tenancy with:
-- - Tenant model with API keys, commission rates, and Stripe Connect
-- - All core models (Package, AddOn, Booking, BlackoutDate, WebhookEvent)
--   have tenant isolation via tenantId
-- - Composite unique constraints ensure data integrity per tenant
-- - Indexes optimize tenant-scoped queries
-- - Existing data migrated to default "elope" tenant
-- =====================================================================
