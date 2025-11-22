import { useState, useEffect, useCallback } from "react";
import { Package, XCircle, Calendar, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "../../lib/api";
import { cn } from "@/lib/utils";
import type { PackageDto, BookingDto } from "@macon/contracts";
import { TenantPackagesManager } from "./TenantPackagesManager";
import { BlackoutsManager } from "./BlackoutsManager";
import { TenantBookingList } from "./TenantBookingList";
import { BrandingEditor } from "./BrandingEditor";
import { AdminLayout } from "../../layouts/AdminLayout";

type BlackoutDto = {
  id: string;
  tenantId: string;
  date: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

type BrandingDto = {
  id: string;
  tenantId: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type TenantDto = {
  id: string;
  slug: string;
  name: string;
  email: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

interface TenantDashboardProps {
  tenantInfo?: TenantDto;
}

export function TenantDashboard({ tenantInfo }: TenantDashboardProps) {
  const [activeTab, setActiveTab] = useState<"packages" | "blackouts" | "bookings" | "branding">("packages");
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [blackouts, setBlackouts] = useState<BlackoutDto[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [branding, setBranding] = useState<BrandingDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "packages") {
      loadPackages();
    } else if (activeTab === "blackouts") {
      loadBlackouts();
    } else if (activeTab === "bookings") {
      loadBookings();
    } else if (activeTab === "branding") {
      loadBranding();
    }
  }, [activeTab]);

  const loadPackages = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.tenantAdminGetPackages();
      if (result.status === 200) {
        setPackages(result.body);
      }
    } catch (error) {
      console.error("Failed to load packages:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBlackouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.tenantAdminGetBlackouts();
      if (result.status === 200) {
        setBlackouts(result.body);
      }
    } catch (error) {
      console.error("Failed to load blackouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.tenantAdminGetBookings();
      if (result.status === 200) {
        setBookings(result.body);
      }
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBranding = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.tenantAdminGetBranding();
      if (result.status === 200) {
        setBranding(result.body);
      }
    } catch (error) {
      console.error("Failed to load branding:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AdminLayout
      breadcrumbs={[
        { label: "Dashboard" }
      ]}
    >
      <div className="max-w-7xl mx-auto space-y-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6 border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-macon-navy-50 rounded">
                <Package className="w-5 h-5 text-macon-navy-600" />
              </div>
              <div className="text-sm font-medium text-neutral-700">Total Packages</div>
            </div>
            <div className="text-3xl font-bold text-neutral-900">{packages.length}</div>
          </Card>

          <Card className="p-6 border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-macon-orange-50 rounded">
                <XCircle className="w-5 h-5 text-macon-orange-600" />
              </div>
              <div className="text-sm font-medium text-neutral-700">Blackout Dates</div>
            </div>
            <div className="text-3xl font-bold text-neutral-900">{blackouts.length}</div>
          </Card>

          <Card className="p-6 border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-macon-navy-50 rounded">
                <Calendar className="w-5 h-5 text-macon-navy-600" />
              </div>
              <div className="text-sm font-medium text-neutral-700">Total Bookings</div>
            </div>
            <div className="text-3xl font-bold text-neutral-900">{bookings.length}</div>
          </Card>

          <Card className="p-6 border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-macon-orange-50 rounded">
                <Palette className="w-5 h-5 text-macon-orange-600" />
              </div>
              <div className="text-sm font-medium text-neutral-700">Branding</div>
            </div>
            <div className="text-lg font-medium text-neutral-600">
              {branding ? "Configured" : "Not Set"}
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab("packages")}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px]",
                activeTab === "packages"
                  ? "border-macon-navy-600 text-macon-navy-600"
                  : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
              )}
            >
              Packages
            </button>
            <button
              onClick={() => setActiveTab("blackouts")}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px]",
                activeTab === "blackouts"
                  ? "border-macon-navy-600 text-macon-navy-600"
                  : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
              )}
            >
              Blackouts
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px]",
                activeTab === "bookings"
                  ? "border-macon-navy-600 text-macon-navy-600"
                  : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
              )}
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveTab("branding")}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px]",
                activeTab === "branding"
                  ? "border-macon-navy-600 text-macon-navy-600"
                  : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
              )}
            >
              Branding
            </button>
          </nav>
        </div>

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
