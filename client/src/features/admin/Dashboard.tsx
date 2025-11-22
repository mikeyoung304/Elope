import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "../../lib/api";
import type { BookingDto, PackageDto } from "@macon/contracts";
import { PackagesManager } from "./packages";
import { BookingList } from "./BookingList";
import { DashboardMetrics } from "./dashboard/components/DashboardMetrics";
import { TabNavigation } from "./dashboard/components/TabNavigation";
import { BlackoutsTab } from "./dashboard/tabs/BlackoutsTab";

type Blackout = {
  date: string;
  reason?: string;
};

/**
 * Dashboard Component
 *
 * Main admin dashboard with tabs for bookings, blackouts, and packages.
 * Refactored to use smaller components for better maintainability.
 */
export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"bookings" | "blackouts" | "packages">("bookings");
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "bookings") {
      loadBookings();
    } else if (activeTab === "blackouts") {
      loadBlackouts();
    } else if (activeTab === "packages") {
      loadPackages();
    }
  }, [activeTab]);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.adminGetBookings();
      if (result.status === 200) {
        setBookings(result.body);
      }
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBlackouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.adminGetBlackouts();
      if (result.status === 200) {
        setBlackouts(result.body);
      }
    } catch (error) {
      console.error("Failed to load blackouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPackages = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.getPackages();
      if (result.status === 200) {
        setPackages(result.body);
      }
    } catch (error) {
      console.error("Failed to load packages:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddBlackout = useCallback(async (date: string, reason: string) => {
    try {
      const result = await api.adminCreateBlackout({
        body: {
          date,
          reason: reason || undefined,
        },
      });

      if (result.status === 200) {
        loadBlackouts();
      }
    } catch (error) {
      console.error("Failed to create blackout:", error);
    }
  }, [loadBlackouts]);

  const exportToCSV = useCallback(() => {
    if (bookings.length === 0) return;

    const headers = ["Couple", "Email", "Date", "Package ID", "Total"];
    const rows = bookings.map((b) => [
      b.coupleName,
      b.email,
      b.eventDate,
      b.packageId,
      `$${(b.totalCents / 100).toFixed(2)}`,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bookings]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  }, [navigate]);

  // Calculate metrics with useMemo
  const metrics = useMemo(() => {
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalCents, 0);
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    return { totalBookings, totalRevenue, averageBookingValue };
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-macon-navy-50">Admin Dashboard</h1>
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
      <DashboardMetrics
        totalBookings={metrics.totalBookings}
        totalRevenue={metrics.totalRevenue}
        packagesCount={packages.length}
        blackoutsCount={blackouts.length}
      />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <BookingList bookings={bookings} isLoading={isLoading} onExportCSV={exportToCSV} />
      )}

      {/* Blackouts Tab */}
      {activeTab === "blackouts" && (
        <BlackoutsTab
          blackouts={blackouts}
          isLoading={isLoading}
          onAddBlackout={handleAddBlackout}
        />
      )}

      {/* Packages Tab */}
      {activeTab === "packages" && (
        <PackagesManager packages={packages} onPackagesChange={loadPackages} />
      )}
    </div>
  );
}
