import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Package, XCircle, Calendar, Palette, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "../../lib/api";
import { cn } from "@/lib/utils";
import type { PackageDto, BookingDto } from "@elope/contracts";
import { TenantPackagesManager } from "./TenantPackagesManager";
import { BlackoutsManager } from "./BlackoutsManager";
import { TenantBookingList } from "./TenantBookingList";
import { BrandingEditor } from "./BrandingEditor";

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
  const navigate = useNavigate();
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
      // Agent 2 will create this endpoint
      const result = await (api as any).tenantGetPackages();
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
      const result = await (api as any).tenantGetBlackouts();
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
      const result = await (api as any).tenantGetBookings();
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
      const result = await (api as any).tenantGetBranding();
      if (result.status === 200) {
        setBranding(result.body);
      }
    } catch (error) {
      console.error("Failed to load branding:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    (api as any).logoutTenant();
    navigate("/tenant/login");
  }, [navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-macon-navy-50">Tenant Dashboard</h1>
          {tenantInfo && (
            <p className="text-lg text-macon-navy-200 mt-2">
              {tenantInfo.name} ({tenantInfo.slug})
            </p>
          )}
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="lg"
          className="border-macon-navy-600 text-macon-navy-100 hover:bg-macon-navy-800 text-lg"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-macon-navy-700 rounded">
              <Package className="w-5 h-5 text-macon-navy-300" />
            </div>
            <div className="text-base text-macon-navy-100">Total Packages</div>
          </div>
          <div className="text-4xl font-bold text-macon-navy-50">{packages.length}</div>
        </Card>

        <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-macon-navy-700 rounded">
              <XCircle className="w-5 h-5 text-macon-navy-300" />
            </div>
            <div className="text-base text-macon-navy-100">Blackout Dates</div>
          </div>
          <div className="text-4xl font-bold text-macon-navy-300">{blackouts.length}</div>
        </Card>

        <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-macon-navy-700 rounded">
              <Calendar className="w-5 h-5 text-macon-navy-300" />
            </div>
            <div className="text-base text-macon-navy-100">Total Bookings</div>
          </div>
          <div className="text-4xl font-bold text-macon-navy-50">{bookings.length}</div>
        </Card>

        <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-macon-navy-700 rounded">
              <Palette className="w-5 h-5 text-macon-navy-300" />
            </div>
            <div className="text-base text-macon-navy-100">Branding</div>
          </div>
          <div className="text-lg font-medium text-macon-navy-300">
            {branding ? "Configured" : "Not Set"}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-macon-navy-600">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab("packages")}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-lg transition-colors",
              activeTab === "packages"
                ? "border-macon-navy-500 text-macon-navy-300"
                : "border-transparent text-macon-navy-100 hover:text-macon-navy-300 hover:border-macon-navy-500"
            )}
          >
            Packages
          </button>
          <button
            onClick={() => setActiveTab("blackouts")}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-lg transition-colors",
              activeTab === "blackouts"
                ? "border-macon-navy-500 text-macon-navy-300"
                : "border-transparent text-macon-navy-100 hover:text-macon-navy-300 hover:border-macon-navy-500"
            )}
          >
            Blackouts
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-lg transition-colors",
              activeTab === "bookings"
                ? "border-macon-navy-500 text-macon-navy-300"
                : "border-transparent text-macon-navy-100 hover:text-macon-navy-300 hover:border-macon-navy-500"
            )}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab("branding")}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-lg transition-colors",
              activeTab === "branding"
                ? "border-macon-navy-500 text-macon-navy-300"
                : "border-transparent text-macon-navy-100 hover:text-macon-navy-300 hover:border-macon-navy-500"
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
  );
}
