-- =====================================================================
-- Migration: Add Scheduling Platform Features
-- Description: Adds scheduling models (Service, AvailabilityRule) and
--              booking type support for time-slot based scheduling
-- Date: 2025-11-28
-- =====================================================================

-- -----------------------------------------------------------------------
-- Step 1: Create BookingType enum
-- -----------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingType') THEN
    CREATE TYPE "BookingType" AS ENUM ('DATE', 'TIMESLOT');
    RAISE NOTICE 'Created BookingType enum';
  ELSE
    RAISE NOTICE 'BookingType enum already exists';
  END IF;
END $$;

-- -----------------------------------------------------------------------
-- Step 2: Add new columns to Booking table
-- -----------------------------------------------------------------------

-- Add bookingType column with default DATE (preserves legacy behavior)
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "bookingType" "BookingType" NOT NULL DEFAULT 'DATE';

-- Add serviceId for time-slot bookings
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "serviceId" TEXT;

-- Add clientTimezone for display purposes
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "clientTimezone" TEXT;

-- Add googleEventId for calendar sync
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "googleEventId" TEXT;

-- Add cancelledAt timestamp
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);

-- -----------------------------------------------------------------------
-- Step 3: Create Service table
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Service" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "durationMinutes" INTEGER NOT NULL,
  "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
  "priceCents" INTEGER NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "segmentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "Service_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE SET NULL
);

-- Service unique constraint
ALTER TABLE "Service"
  DROP CONSTRAINT IF EXISTS "Service_tenantId_slug_key";
ALTER TABLE "Service"
  ADD CONSTRAINT "Service_tenantId_slug_key" UNIQUE ("tenantId", "slug");

-- Service indexes
CREATE INDEX IF NOT EXISTS "Service_tenantId_idx" ON "Service"("tenantId");
CREATE INDEX IF NOT EXISTS "Service_tenantId_active_idx" ON "Service"("tenantId", "active");
CREATE INDEX IF NOT EXISTS "Service_segmentId_idx" ON "Service"("segmentId");

-- -----------------------------------------------------------------------
-- Step 4: Create AvailabilityRule table
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "AvailabilityRule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "serviceId" TEXT,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AvailabilityRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "AvailabilityRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE
);

-- AvailabilityRule unique constraint
ALTER TABLE "AvailabilityRule"
  DROP CONSTRAINT IF EXISTS "AvailabilityRule_tenantId_serviceId_dayOfWeek_startTime_key";
ALTER TABLE "AvailabilityRule"
  ADD CONSTRAINT "AvailabilityRule_tenantId_serviceId_dayOfWeek_startTime_key"
  UNIQUE ("tenantId", "serviceId", "dayOfWeek", "startTime");

-- AvailabilityRule indexes
CREATE INDEX IF NOT EXISTS "AvailabilityRule_tenantId_dayOfWeek_idx" ON "AvailabilityRule"("tenantId", "dayOfWeek");
CREATE INDEX IF NOT EXISTS "AvailabilityRule_serviceId_idx" ON "AvailabilityRule"("serviceId");

-- -----------------------------------------------------------------------
-- Step 5: Add foreign key from Booking to Service
-- -----------------------------------------------------------------------
ALTER TABLE "Booking"
  DROP CONSTRAINT IF EXISTS "Booking_serviceId_fkey";
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL;

-- -----------------------------------------------------------------------
-- Step 6: Update Booking unique constraint for bookingType
-- -----------------------------------------------------------------------

-- Drop the old constraint (tenantId, date)
ALTER TABLE "Booking"
  DROP CONSTRAINT IF EXISTS "Booking_tenantId_date_key";

-- Add new composite constraint (tenantId, date, bookingType)
-- This allows one DATE booking and one TIMESLOT booking on the same date
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_tenantId_date_bookingType_key"
  UNIQUE ("tenantId", "date", "bookingType");

-- -----------------------------------------------------------------------
-- Step 7: Add new Booking indexes
-- -----------------------------------------------------------------------

-- Index for time-slot queries
CREATE INDEX IF NOT EXISTS "Booking_tenantId_startTime_idx" ON "Booking"("tenantId", "startTime");

-- Index for serviceId queries
CREATE INDEX IF NOT EXISTS "Booking_serviceId_idx" ON "Booking"("serviceId");

-- Index for venueId queries (if not exists)
CREATE INDEX IF NOT EXISTS "Booking_venueId_idx" ON "Booking"("venueId");

-- Index for googleEventId lookups
CREATE INDEX IF NOT EXISTS "Booking_googleEventId_idx" ON "Booking"("googleEventId");

-- -----------------------------------------------------------------------
-- Step 8: Add partial unique index for TIMESLOT double-booking prevention
-- -----------------------------------------------------------------------

-- This prevents two TIMESLOT bookings for the same tenant + service + start time
-- Only applies when startTime IS NOT NULL (i.e., TIMESLOT bookings)
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_timeslot_unique"
ON "Booking"("tenantId", "serviceId", "startTime")
WHERE "startTime" IS NOT NULL AND "serviceId" IS NOT NULL;

-- Composite index for efficient overlap detection in slot availability queries
CREATE INDEX IF NOT EXISTS "Booking_tenantId_serviceId_startTime_endTime_idx"
ON "Booking"("tenantId", "serviceId", "startTime", "endTime")
WHERE "bookingType" = 'TIMESLOT';

-- -----------------------------------------------------------------------
-- Step 9: Verification
-- -----------------------------------------------------------------------
DO $$
DECLARE
  booking_type_exists BOOLEAN;
  service_count INTEGER;
  availability_count INTEGER;
BEGIN
  -- Check BookingType enum
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingType') INTO booking_type_exists;

  -- Check Service table
  SELECT COUNT(*) INTO service_count FROM information_schema.tables WHERE table_name = 'Service';

  -- Check AvailabilityRule table
  SELECT COUNT(*) INTO availability_count FROM information_schema.tables WHERE table_name = 'AvailabilityRule';

  RAISE NOTICE 'Migration verification:';
  RAISE NOTICE '  - BookingType enum exists: %', booking_type_exists;
  RAISE NOTICE '  - Service table exists: %', service_count > 0;
  RAISE NOTICE '  - AvailabilityRule table exists: %', availability_count > 0;

  IF NOT booking_type_exists THEN
    RAISE EXCEPTION 'BookingType enum was not created!';
  END IF;
END $$;

-- =====================================================================
-- Migration Complete
-- =====================================================================
-- The database now supports scheduling platform features:
-- - BookingType enum (DATE, TIMESLOT)
-- - Booking.bookingType column with default DATE (backward compatible)
-- - Booking.serviceId, clientTimezone, googleEventId, cancelledAt columns
-- - Service table for bookable services/appointment types
-- - AvailabilityRule table for defining service availability
-- - Updated unique constraint: (tenantId, date, bookingType)
-- - Partial unique index for TIMESLOT double-booking prevention
-- =====================================================================
