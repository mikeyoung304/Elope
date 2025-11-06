-- Migration: Add WebhookEvent table for webhook idempotency and dead letter queue
-- Date: 2025-10-29
-- Phase: 2B - Webhook Error Handling
-- Idempotent: YES (can run multiple times safely)

-- Create WebhookStatus enum (idempotent)
DO $$ BEGIN
  CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'DUPLICATE');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;  -- Enum already exists, continue
END $$;

-- Create WebhookEvent table (idempotent)
CREATE TABLE IF NOT EXISTS "WebhookEvent" (
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

-- Create unique index on eventId (idempotent)
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");
EXCEPTION
  WHEN duplicate_table THEN
    NULL;  -- Index already exists
END $$;

-- Create index on eventId for lookups (idempotent)
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "WebhookEvent_eventId_idx" ON "WebhookEvent"("eventId");
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Create index on status for filtering (idempotent)
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "WebhookEvent_status_idx" ON "WebhookEvent"("status");
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;
