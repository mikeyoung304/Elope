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
