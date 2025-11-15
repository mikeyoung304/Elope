-- Migration: Add Additional Performance Indexes
-- Created: 2025-11-14
-- Purpose: Add missing database indexes for foreign keys and query optimization
-- Phase A Wave 1 - Database Schema & Query Optimization

-- ========================================
-- FOREIGN KEY INDEXES (Join Performance)
-- ========================================

-- PackageAddOn junction table indexes for bidirectional lookups
CREATE INDEX IF NOT EXISTS "PackageAddOn_packageId_idx" ON "PackageAddOn"("packageId");
CREATE INDEX IF NOT EXISTS "PackageAddOn_addOnId_idx" ON "PackageAddOn"("addOnId");

-- BookingAddOn junction table indexes for bidirectional lookups
CREATE INDEX IF NOT EXISTS "BookingAddOn_bookingId_idx" ON "BookingAddOn"("bookingId");
CREATE INDEX IF NOT EXISTS "BookingAddOn_addOnId_idx" ON "BookingAddOn"("addOnId");

-- Payment foreign key index for booking payment lookups
CREATE INDEX IF NOT EXISTS "Payment_bookingId_idx" ON "Payment"("bookingId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

-- Booking foreign key indexes for package and venue lookups
CREATE INDEX IF NOT EXISTS "Booking_packageId_idx" ON "Booking"("packageId");
CREATE INDEX IF NOT EXISTS "Booking_venueId_idx" ON "Booking"("venueId");

-- ========================================
-- LOOKUP & FILTER INDEXES
-- ========================================

-- Customer email index for faster customer lookups
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");

-- Package slug index for slug-based lookups (widget queries)
CREATE INDEX IF NOT EXISTS "Package_slug_idx" ON "Package"("slug");

-- ========================================
-- COMPOSITE INDEXES (Multi-tenant Queries)
-- ========================================

-- Booking confirmed date index for revenue/reporting queries
CREATE INDEX IF NOT EXISTS "Booking_tenantId_confirmedAt_idx" ON "Booking"("tenantId", "confirmedAt");

-- Venue city index for location-based venue queries
CREATE INDEX IF NOT EXISTS "Venue_tenantId_city_idx" ON "Venue"("tenantId", "city");

-- ConfigChangeLog user tracking per tenant
CREATE INDEX IF NOT EXISTS "ConfigChangeLog_tenantId_userId_idx" ON "ConfigChangeLog"("tenantId", "userId");

-- ConfigChangeLog entity change lookup (global debugging)
CREATE INDEX IF NOT EXISTS "ConfigChangeLog_entityType_entityId_idx" ON "ConfigChangeLog"("entityType", "entityId");

-- ========================================
-- PERFORMANCE NOTES
-- ========================================
-- These indexes improve:
-- 1. Foreign key join performance (PostgreSQL doesn't auto-index foreign keys)
-- 2. Multi-tenant data isolation queries (tenantId composites)
-- 3. Common query patterns (email lookups, slug lookups)
-- 4. Reporting queries (confirmedAt for revenue tracking)
-- 5. Audit trail lookups (ConfigChangeLog)
