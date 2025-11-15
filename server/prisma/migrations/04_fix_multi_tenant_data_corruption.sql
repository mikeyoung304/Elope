-- =====================================================================
-- Migration: Fix Multi-Tenant Data Corruption Issues
-- Description: Adds tenant isolation to Customer and Venue models,
--              fixes WebhookEvent eventId constraint
-- Date: 2025-11-14
-- CRITICAL: This migration fixes data corruption vulnerabilities
-- =====================================================================

-- -----------------------------------------------------------------------
-- Step 1: Add tenantId to Customer table
-- -----------------------------------------------------------------------

-- Add tenantId column (nullable initially for data migration)
ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- -----------------------------------------------------------------------
-- Step 2: Migrate existing Customer data to default tenant
-- -----------------------------------------------------------------------

-- Populate tenantId for existing customers
-- Strategy: Assign customers to their tenant based on their bookings
-- If a customer has bookings from multiple tenants (should not happen),
-- we'll need to duplicate the customer record per tenant
DO $$
DECLARE
  customer_record RECORD;
  tenant_record RECORD;
  new_customer_id TEXT;
BEGIN
  -- For each existing customer
  FOR customer_record IN
    SELECT id, email, phone, name, "createdAt", "updatedAt"
    FROM "Customer"
    WHERE "tenantId" IS NULL
  LOOP
    -- Find all tenants this customer has bookings with
    FOR tenant_record IN
      SELECT DISTINCT "tenantId"
      FROM "Booking"
      WHERE "customerId" = customer_record.id
    LOOP
      -- If this is the first tenant, update the existing customer
      IF customer_record."tenantId" IS NULL THEN
        UPDATE "Customer"
        SET "tenantId" = tenant_record."tenantId"
        WHERE id = customer_record.id;

        customer_record."tenantId" := tenant_record."tenantId";
      ELSE
        -- Customer has bookings with multiple tenants (data corruption case)
        -- Create a duplicate customer record for this tenant
        new_customer_id := 'cust_' || substr(md5(random()::text), 1, 24);

        INSERT INTO "Customer" (
          id,
          "tenantId",
          email,
          phone,
          name,
          "createdAt",
          "updatedAt"
        ) VALUES (
          new_customer_id,
          tenant_record."tenantId",
          customer_record.email,
          customer_record.phone,
          customer_record.name,
          customer_record."createdAt",
          customer_record."updatedAt"
        );

        -- Update bookings for this tenant to point to new customer
        UPDATE "Booking"
        SET "customerId" = new_customer_id
        WHERE "customerId" = customer_record.id
          AND "tenantId" = tenant_record."tenantId";

        RAISE NOTICE 'Created duplicate customer % for tenant % (original: %)',
          new_customer_id, tenant_record."tenantId", customer_record.id;
      END IF;
    END LOOP;
  END LOOP;

  -- Handle orphaned customers (no bookings) - assign to default tenant
  UPDATE "Customer"
  SET "tenantId" = 'tenant_default_legacy'
  WHERE "tenantId" IS NULL;
END $$;

-- -----------------------------------------------------------------------
-- Step 3: Make Customer.tenantId NOT NULL and add constraints
-- -----------------------------------------------------------------------

-- Make tenantId required
ALTER TABLE "Customer"
  ALTER COLUMN "tenantId" SET NOT NULL;

-- Drop old global unique constraint on email
ALTER TABLE "Customer"
  DROP CONSTRAINT IF EXISTS "Customer_email_key";

-- Add composite unique constraint (tenantId + email)
ALTER TABLE "Customer"
  ADD CONSTRAINT "Customer_tenantId_email_key"
  UNIQUE ("tenantId", "email");

-- Add foreign key constraint to Tenant
ALTER TABLE "Customer"
  ADD CONSTRAINT "Customer_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE;

-- Add performance index
CREATE INDEX IF NOT EXISTS "Customer_tenantId_idx" ON "Customer"("tenantId");

-- -----------------------------------------------------------------------
-- Step 4: Add tenantId to Venue table
-- -----------------------------------------------------------------------

-- Add tenantId column (nullable initially for data migration)
ALTER TABLE "Venue"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- -----------------------------------------------------------------------
-- Step 5: Migrate existing Venue data to default tenant
-- -----------------------------------------------------------------------

-- Populate tenantId for existing venues
-- Strategy: Assign venues to their tenant based on their bookings
-- If a venue has bookings from multiple tenants (data corruption case),
-- we'll need to duplicate the venue record per tenant
DO $$
DECLARE
  venue_record RECORD;
  tenant_record RECORD;
  new_venue_id TEXT;
BEGIN
  -- For each existing venue
  FOR venue_record IN
    SELECT id, name, address, city, state, zip, capacity, "createdAt", "updatedAt"
    FROM "Venue"
    WHERE "tenantId" IS NULL
  LOOP
    -- Find all tenants this venue has bookings with
    FOR tenant_record IN
      SELECT DISTINCT "tenantId"
      FROM "Booking"
      WHERE "venueId" = venue_record.id
    LOOP
      -- If this is the first tenant, update the existing venue
      IF venue_record."tenantId" IS NULL THEN
        UPDATE "Venue"
        SET "tenantId" = tenant_record."tenantId"
        WHERE id = venue_record.id;

        venue_record."tenantId" := tenant_record."tenantId";
      ELSE
        -- Venue has bookings with multiple tenants (data corruption case)
        -- Create a duplicate venue record for this tenant
        new_venue_id := 'venue_' || substr(md5(random()::text), 1, 22);

        INSERT INTO "Venue" (
          id,
          "tenantId",
          name,
          address,
          city,
          state,
          zip,
          capacity,
          "createdAt",
          "updatedAt"
        ) VALUES (
          new_venue_id,
          tenant_record."tenantId",
          venue_record.name,
          venue_record.address,
          venue_record.city,
          venue_record.state,
          venue_record.zip,
          venue_record.capacity,
          venue_record."createdAt",
          venue_record."updatedAt"
        );

        -- Update bookings for this tenant to point to new venue
        UPDATE "Booking"
        SET "venueId" = new_venue_id
        WHERE "venueId" = venue_record.id
          AND "tenantId" = tenant_record."tenantId";

        RAISE NOTICE 'Created duplicate venue % for tenant % (original: %)',
          new_venue_id, tenant_record."tenantId", venue_record.id;
      END IF;
    END LOOP;
  END LOOP;

  -- Handle orphaned venues (no bookings) - assign to default tenant
  UPDATE "Venue"
  SET "tenantId" = 'tenant_default_legacy'
  WHERE "tenantId" IS NULL;
END $$;

-- -----------------------------------------------------------------------
-- Step 6: Make Venue.tenantId NOT NULL and add constraints
-- -----------------------------------------------------------------------

-- Make tenantId required
ALTER TABLE "Venue"
  ALTER COLUMN "tenantId" SET NOT NULL;

-- Add composite unique constraint (tenantId + name)
ALTER TABLE "Venue"
  ADD CONSTRAINT "Venue_tenantId_name_key"
  UNIQUE ("tenantId", "name");

-- Add foreign key constraint to Tenant
ALTER TABLE "Venue"
  ADD CONSTRAINT "Venue_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE;

-- Add performance index
CREATE INDEX IF NOT EXISTS "Venue_tenantId_idx" ON "Venue"("tenantId");

-- -----------------------------------------------------------------------
-- Step 7: Fix WebhookEvent eventId constraint
-- -----------------------------------------------------------------------

-- Drop old global unique constraint on eventId
ALTER TABLE "WebhookEvent"
  DROP CONSTRAINT IF EXISTS "WebhookEvent_eventId_key";

-- Add composite unique constraint (tenantId + eventId)
-- CRITICAL: This prevents cross-tenant event hijacking
ALTER TABLE "WebhookEvent"
  ADD CONSTRAINT "WebhookEvent_tenantId_eventId_key"
  UNIQUE ("tenantId", "eventId");

-- -----------------------------------------------------------------------
-- Step 8: Verification queries (informational)
-- -----------------------------------------------------------------------

-- Verify Customer migration
DO $$
DECLARE
  total_customers INTEGER;
  orphan_customers INTEGER;
  duplicate_customers INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_customers FROM "Customer";
  SELECT COUNT(*) INTO orphan_customers FROM "Customer" WHERE "tenantId" IS NULL;

  -- Count customers with duplicate emails (now scoped per tenant)
  SELECT COUNT(*) INTO duplicate_customers
  FROM (
    SELECT "tenantId", email, COUNT(*) as cnt
    FROM "Customer"
    WHERE email IS NOT NULL
    GROUP BY "tenantId", email
    HAVING COUNT(*) > 1
  ) AS duplicates;

  RAISE NOTICE 'Customer migration complete: total=%, orphans=%, duplicates=%',
    total_customers, orphan_customers, duplicate_customers;

  IF orphan_customers > 0 THEN
    RAISE WARNING 'Found % orphaned customers without tenantId', orphan_customers;
  END IF;

  IF duplicate_customers > 0 THEN
    RAISE WARNING 'Found % duplicate customer emails per tenant', duplicate_customers;
  END IF;
END $$;

-- Verify Venue migration
DO $$
DECLARE
  total_venues INTEGER;
  orphan_venues INTEGER;
  duplicate_venues INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_venues FROM "Venue";
  SELECT COUNT(*) INTO orphan_venues FROM "Venue" WHERE "tenantId" IS NULL;

  -- Count venues with duplicate names (now scoped per tenant)
  SELECT COUNT(*) INTO duplicate_venues
  FROM (
    SELECT "tenantId", name, COUNT(*) as cnt
    FROM "Venue"
    GROUP BY "tenantId", name
    HAVING COUNT(*) > 1
  ) AS duplicates;

  RAISE NOTICE 'Venue migration complete: total=%, orphans=%, duplicates=%',
    total_venues, orphan_venues, duplicate_venues;

  IF orphan_venues > 0 THEN
    RAISE WARNING 'Found % orphaned venues without tenantId', orphan_venues;
  END IF;

  IF duplicate_venues > 0 THEN
    RAISE WARNING 'Found % duplicate venue names per tenant', duplicate_venues;
  END IF;
END $$;

-- Verify WebhookEvent constraint
DO $$
DECLARE
  duplicate_events INTEGER;
BEGIN
  -- Count webhook events with duplicate eventIds (now scoped per tenant)
  SELECT COUNT(*) INTO duplicate_events
  FROM (
    SELECT "tenantId", "eventId", COUNT(*) as cnt
    FROM "WebhookEvent"
    GROUP BY "tenantId", "eventId"
    HAVING COUNT(*) > 1
  ) AS duplicates;

  RAISE NOTICE 'WebhookEvent constraint updated: duplicate_events=%', duplicate_events;

  IF duplicate_events > 0 THEN
    RAISE WARNING 'Found % duplicate webhook eventIds per tenant (should be 0)', duplicate_events;
  END IF;
END $$;

-- =====================================================================
-- Migration Complete
-- =====================================================================
-- The database now has proper tenant isolation for:
-- - Customer model: email unique per tenant (not globally)
-- - Venue model: name unique per tenant (not globally)
-- - WebhookEvent model: eventId unique per tenant (prevents hijacking)
--
-- CRITICAL FIXES:
-- 1. Customer emails are now scoped per tenant (prevents data leakage)
-- 2. Venues are now scoped per tenant (prevents cross-tenant sharing)
-- 3. Webhook eventIds are now scoped per tenant (prevents event hijacking)
--
-- Data Migration Strategy:
-- - Existing customers/venues assigned to tenants based on their bookings
-- - Cross-tenant customers/venues duplicated (one per tenant)
-- - Orphaned records assigned to default legacy tenant
-- =====================================================================
