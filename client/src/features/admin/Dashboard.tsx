import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, DollarSign, Package, XCircle, LogOut, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import type { BookingDto, PackageDto } from "@elope/contracts";
import { PackagesManager } from "./PackagesManager";
import { BookingList } from "./BookingList";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Blackout = {
  date: string;
  reason?: string;
};

export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"bookings" | "blackouts" | "packages">("bookings");
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [newBlackoutReason, setNewBlackoutReason] = useState("");

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

  const handleAddBlackout = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlackoutDate) return;

    try {
      const result = await api.adminCreateBlackout({
        body: {
          date: newBlackoutDate,
          reason: newBlackoutReason || undefined,
        },
      });

      if (result.status === 200) {
        setNewBlackoutDate("");
        setNewBlackoutReason("");
        loadBlackouts();
      }
    } catch (error) {
      console.error("Failed to create blackout:", error);
    }
  }, [newBlackoutDate, newBlackoutReason, loadBlackouts]);

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
    navigate("/admin/login");
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
        <h1 className="text-4xl font-bold text-lavender-50">Admin Dashboard</h1>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="lg"
          className="border-navy-600 text-lavender-100 hover:bg-navy-800 text-lg"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-navy-800 border-navy-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-navy-700 rounded">
              <Calendar className="w-5 h-5 text-lavender-300" />
            </div>
            <div className="text-base text-lavender-100">Total Bookings</div>
          </div>
          <div className="text-4xl font-bold text-lavender-50">{metrics.totalBookings}</div>
        </Card>

        <Card className="p-6 bg-navy-800 border-navy-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-navy-700 rounded">
              <DollarSign className="w-5 h-5 text-lavender-300" />
            </div>
            <div className="text-base text-lavender-100">Total Revenue</div>
          </div>
          <div className="text-4xl font-bold text-lavender-300">
            {formatCurrency(metrics.totalRevenue)}
          </div>
        </Card>

        <Card className="p-6 bg-navy-800 border-navy-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-navy-700 rounded">
              <Package className="w-5 h-5 text-lavender-300" />
            </div>
            <div className="text-base text-lavender-100">Total Packages</div>
          </div>
          <div className="text-4xl font-bold text-lavender-50">{packages.length}</div>
        </Card>

        <Card className="p-6 bg-navy-800 border-navy-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-navy-700 rounded">
              <XCircle className="w-5 h-5 text-lavender-300" />
            </div>
            <div className="text-base text-lavender-100">Blackout Dates</div>
          </div>
          <div className="text-4xl font-bold text-lavender-300">{blackouts.length}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-navy-600">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab("bookings")}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-lg transition-colors",
              activeTab === "bookings"
                ? "border-lavender-500 text-lavender-300"
                : "border-transparent text-lavender-100 hover:text-lavender-300 hover:border-navy-500"
            )}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab("blackouts")}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-lg transition-colors",
              activeTab === "blackouts"
                ? "border-lavender-500 text-lavender-300"
                : "border-transparent text-lavender-100 hover:text-lavender-300 hover:border-navy-500"
            )}
          >
            Blackouts
          </button>
          <button
            onClick={() => setActiveTab("packages")}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-lg transition-colors",
              activeTab === "packages"
                ? "border-lavender-500 text-lavender-300"
                : "border-transparent text-lavender-100 hover:text-lavender-300 hover:border-navy-500"
            )}
          >
            Packages
          </button>
        </nav>
      </div>

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <BookingList bookings={bookings} isLoading={isLoading} onExportCSV={exportToCSV} />
      )}

      {/* Blackouts Tab */}
      {activeTab === "blackouts" && (
        <div className="space-y-6">
          <Card className="p-6 bg-navy-800 border-navy-600">
            <h2 className="text-2xl font-semibold mb-4 text-lavender-50">Add Blackout Date</h2>
            <form onSubmit={handleAddBlackout} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="blackoutDate" className="text-lavender-100 text-lg">
                  Date
                </Label>
                <Input
                  id="blackoutDate"
                  type="date"
                  value={newBlackoutDate}
                  onChange={(e) => setNewBlackoutDate(e.target.value)}
                  className="bg-navy-900 border-navy-600 text-lavender-50 focus:border-lavender-500 text-lg h-12"
                  required
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="blackoutReason" className="text-lavender-100 text-lg">
                  Reason (optional)
                </Label>
                <Input
                  id="blackoutReason"
                  type="text"
                  value={newBlackoutReason}
                  onChange={(e) => setNewBlackoutReason(e.target.value)}
                  placeholder="Holiday, maintenance, etc."
                  className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="bg-lavender-500 hover:bg-lavender-600 text-lg h-12 px-6">
                  Add
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6 bg-navy-800 border-navy-600">
            <h2 className="text-2xl font-semibold mb-6 text-lavender-50">Blackout Dates</h2>
            <Table>
              <TableHeader>
                <TableRow className="border-navy-600 hover:bg-navy-700">
                  <TableHead className="text-lavender-100 text-lg">Date</TableHead>
                  <TableHead className="text-lavender-100 text-lg">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="hover:bg-navy-700">
                    <TableCell colSpan={2} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-lavender-300" />
                    </TableCell>
                  </TableRow>
                ) : blackouts.length === 0 ? (
                  <TableRow className="hover:bg-navy-700">
                    <TableCell colSpan={2} className="text-center py-8 text-lavender-100 text-lg">
                      No blackout dates
                    </TableCell>
                  </TableRow>
                ) : (
                  blackouts.map((blackout) => (
                    <TableRow key={blackout.date} className="border-navy-600 hover:bg-navy-700">
                      <TableCell className="font-medium">
                        <Badge
                          variant="outline"
                          className="border-navy-500 bg-navy-700 text-lavender-200 text-base"
                        >
                          {blackout.date}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-lavender-100 text-base">
                        {blackout.reason || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === "packages" && (
        <PackagesManager packages={packages} onPackagesChange={loadPackages} />
      )}
    </div>
  );
}
