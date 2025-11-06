-- Migration: Add performance indexes
-- Created: 2025-10-31
-- Purpose: Add missing database indexes to improve query performance

-- Add composite index on Booking (status, date) for filtered queries
CREATE INDEX IF NOT EXISTS "Booking_status_date_idx" ON "Booking"("status", "date");

-- Add index on Booking (customerId) for customer lookup queries
CREATE INDEX IF NOT EXISTS "Booking_customerId_idx" ON "Booking"("customerId");

-- Add index on Booking (createdAt) for time-based queries and sorting
CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");

-- Add index on Package (active) for filtering active packages
CREATE INDEX IF NOT EXISTS "Package_active_idx" ON "Package"("active");

-- Add composite index on WebhookEvent (status, createdAt) for webhook processing queries
CREATE INDEX IF NOT EXISTS "WebhookEvent_status_createdAt_idx" ON "WebhookEvent"("status", "createdAt");
