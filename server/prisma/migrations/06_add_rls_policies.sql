-- =====================================================================
-- Migration: Add Row-Level Security (RLS) Policies
-- Description: Defense-in-depth security layer for multi-tenant isolation
-- Date: 2025-11-25
-- Reference: ADR-003 (Database Architecture Audit)
-- =====================================================================

-- -----------------------------------------------------------------------
-- Step 1: Enable RLS on all tenant-scoped tables
-- -----------------------------------------------------------------------

-- Note: RLS is enabled but policies are PERMISSIVE by default
-- Application still uses tenantId filtering, this adds database-level defense

ALTER TABLE "Package" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AddOn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlackoutDate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebhookEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Venue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Segment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConfigChangeLog" ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------
-- Step 2: Create service role bypass policy
-- -----------------------------------------------------------------------
-- The application connects as a service role and should have full access
-- RLS policies are an additional safety net, not primary enforcement

-- Service role (used by Prisma) bypasses RLS
-- This is the default behavior in Supabase when using service_role key
-- Documented here for clarity

-- -----------------------------------------------------------------------
-- Step 3: Create tenant isolation policies
-- -----------------------------------------------------------------------
-- These policies use app.current_tenant_id setting that must be set
-- before any query in a multi-tenant context

-- Package policies
DROP POLICY IF EXISTS "package_tenant_isolation" ON "Package";
CREATE POLICY "package_tenant_isolation" ON "Package"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- AddOn policies
DROP POLICY IF EXISTS "addon_tenant_isolation" ON "AddOn";
CREATE POLICY "addon_tenant_isolation" ON "AddOn"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- Booking policies
DROP POLICY IF EXISTS "booking_tenant_isolation" ON "Booking";
CREATE POLICY "booking_tenant_isolation" ON "Booking"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- BlackoutDate policies
DROP POLICY IF EXISTS "blackout_tenant_isolation" ON "BlackoutDate";
CREATE POLICY "blackout_tenant_isolation" ON "BlackoutDate"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- WebhookEvent policies
DROP POLICY IF EXISTS "webhook_tenant_isolation" ON "WebhookEvent";
CREATE POLICY "webhook_tenant_isolation" ON "WebhookEvent"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- Customer policies
DROP POLICY IF EXISTS "customer_tenant_isolation" ON "Customer";
CREATE POLICY "customer_tenant_isolation" ON "Customer"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- Venue policies
DROP POLICY IF EXISTS "venue_tenant_isolation" ON "Venue";
CREATE POLICY "venue_tenant_isolation" ON "Venue"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- Segment policies
DROP POLICY IF EXISTS "segment_tenant_isolation" ON "Segment";
CREATE POLICY "segment_tenant_isolation" ON "Segment"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- Payment policies
DROP POLICY IF EXISTS "payment_tenant_isolation" ON "Payment";
CREATE POLICY "payment_tenant_isolation" ON "Payment"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ConfigChangeLog policies
DROP POLICY IF EXISTS "config_log_tenant_isolation" ON "ConfigChangeLog";
CREATE POLICY "config_log_tenant_isolation" ON "ConfigChangeLog"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- -----------------------------------------------------------------------
-- Step 4: Create service role bypass policies
-- -----------------------------------------------------------------------
-- Allow service role (Prisma) to access all rows regardless of tenant
-- Service role is identified by the connection having specific settings

-- Service role can read all packages (for admin operations)
DROP POLICY IF EXISTS "package_service_bypass" ON "Package";
CREATE POLICY "package_service_bypass" ON "Package"
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

DROP POLICY IF EXISTS "addon_service_bypass" ON "AddOn";
CREATE POLICY "addon_service_bypass" ON "AddOn"
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

DROP POLICY IF EXISTS "booking_service_bypass" ON "Booking";
CREATE POLICY "booking_service_bypass" ON "Booking"
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

DROP POLICY IF EXISTS "blackout_service_bypass" ON "BlackoutDate";
CREATE POLICY "blackout_service_bypass" ON "BlackoutDate"
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

DROP POLICY IF EXISTS "webhook_service_bypass" ON "WebhookEvent";
CREATE POLICY "webhook_service_bypass" ON "WebhookEvent"
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

DROP POLICY IF EXISTS "customer_service_bypass" ON "Customer";
CREATE POLICY "customer_service_bypass" ON "Customer"
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

DROP POLICY IF EXISTS "venue_service_bypass" ON "Venue";
CREATE POLICY "venue_service_bypass" ON "Venue"
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

DROP POLICY IF EXISTS "segment_service_bypass" ON "Segment";
CREATE POLICY "segment_service_bypass" ON "Segment"
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

DROP POLICY IF EXISTS "payment_service_bypass" ON "Payment";
CREATE POLICY "payment_service_bypass" ON "Payment"
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

DROP POLICY IF EXISTS "config_log_service_bypass" ON "ConfigChangeLog";
CREATE POLICY "config_log_service_bypass" ON "ConfigChangeLog"
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

-- -----------------------------------------------------------------------
-- Step 5: Helper function to set tenant context
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to enable service bypass for admin operations
CREATE OR REPLACE FUNCTION enable_service_bypass()
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.bypass_rls', 'true', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to disable service bypass (return to tenant-scoped mode)
CREATE OR REPLACE FUNCTION disable_service_bypass()
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.bypass_rls', 'false', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------
-- Documentation
-- -----------------------------------------------------------------------
--
-- RLS USAGE:
--
-- Option 1: Application sets tenant context before queries
--   SELECT set_tenant_context('tenant_abc123');
--   SELECT * FROM "Package"; -- Only returns tenant's packages
--
-- Option 2: Service bypass for admin/platform operations
--   SELECT enable_service_bypass();
--   SELECT * FROM "Package"; -- Returns all packages
--   SELECT disable_service_bypass();
--
-- Option 3: Supabase service_role key (default bypass)
--   Using SUPABASE_SERVICE_KEY automatically bypasses RLS
--
-- IMPORTANT:
-- - Primary tenant isolation is still at application layer (Prisma queries)
-- - RLS is defense-in-depth, not the primary security control
-- - Always test RLS policies don't break existing functionality
--
-- =====================================================================
-- Migration Complete
-- =====================================================================
