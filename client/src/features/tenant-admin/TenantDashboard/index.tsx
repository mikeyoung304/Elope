/**
 * TenantDashboard Component
 *
 * Main dashboard for tenant administrators with modular sub-components
 * Shows impersonation banner when platform admin is impersonating a tenant
 */

import { useState } from "react";
import { TenantPackagesManager } from "../TenantPackagesManager";
import { BlackoutsManager } from "../BlackoutsManager";
import { TenantBookingList } from "../TenantBookingList";
import { BrandingEditor } from "../BrandingEditor";
import { AdminLayout } from "../../../layouts/AdminLayout";
import { MetricsCards } from "./MetricsCards";
import { TabNavigation, type DashboardTab } from "./TabNavigation";
import { useDashboardData } from "./useDashboardData";
import { ImpersonationBanner } from "../../admin/dashboard/components/ImpersonationBanner";
import { useAuth } from "../../../contexts/AuthContext";
import type { TenantDto } from "./types";

interface TenantDashboardProps {
  tenantInfo?: TenantDto;
}

export function TenantDashboard({ tenantInfo }: TenantDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("packages");
  const { isImpersonating, impersonation } = useAuth();

  const {
    packages,
    blackouts,
    bookings,
    branding,
    isLoading,
    loadPackages,
    loadBlackouts,
    loadBranding,
  } = useDashboardData(activeTab);

  return (
    <AdminLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Impersonation Banner */}
        {isImpersonating() && impersonation && (
          <ImpersonationBanner
            tenantName={tenantInfo?.name || impersonation.tenantSlug}
            tenantSlug={impersonation.tenantSlug}
            onStopImpersonation={() => {
              // Banner handles the API call and page reload
            }}
          />
        )}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Tenant Dashboard</h1>
          {tenantInfo && (
            <p className="text-neutral-600 mt-1">
              {tenantInfo.name} ({tenantInfo.slug})
            </p>
          )}
        </div>

        {/* Metrics Cards */}
        <MetricsCards
          packagesCount={packages.length}
          blackoutsCount={blackouts.length}
          bookingsCount={bookings.length}
          hasBranding={!!branding}
        />

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === "packages" && (
          <TenantPackagesManager packages={packages} onPackagesChange={loadPackages} />
        )}

        {activeTab === "blackouts" && (
          <BlackoutsManager
            blackouts={blackouts}
            isLoading={isLoading}
            onBlackoutsChange={loadBlackouts}
          />
        )}

        {activeTab === "bookings" && (
          <TenantBookingList bookings={bookings} isLoading={isLoading} />
        )}

        {activeTab === "branding" && (
          <BrandingEditor
            branding={branding}
            isLoading={isLoading}
            onBrandingChange={loadBranding}
          />
        )}
      </div>
    </AdminLayout>
  );
}