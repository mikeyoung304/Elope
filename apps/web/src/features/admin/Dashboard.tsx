import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { api } from "../../lib/api";
import type { BookingDto } from "@elope/contracts";

type Blackout = {
  date: string;
  reason?: string;
};

export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"bookings" | "blackouts">("bookings");
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [newBlackoutReason, setNewBlackoutReason] = useState("");

  useEffect(() => {
    if (activeTab === "bookings") {
      loadBookings();
    } else {
      loadBlackouts();
    }
  }, [activeTab]);

  const loadBookings = async () => {
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
  };

  const loadBlackouts = async () => {
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
  };

  const handleAddBlackout = async (e: React.FormEvent) => {
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
  };

  const exportToCSV = () => {
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
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleLogout} variant="secondary">
          Logout
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "bookings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab("blackouts")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "blackouts"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Blackouts
          </button>
        </nav>
      </div>

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Bookings</h2>
            <Button onClick={exportToCSV} variant="secondary" disabled={bookings.length === 0}>
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Couple
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-500" colSpan={4}>
                      Loading...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-500" colSpan={4}>
                      No bookings yet
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.coupleName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.eventDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.packageId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${(booking.totalCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Blackouts Tab */}
      {activeTab === "blackouts" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Add Blackout Date</h2>
            <form onSubmit={handleAddBlackout} className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="blackoutDate" className="block text-sm font-medium mb-1">
                  Date
                </label>
                <input
                  id="blackoutDate"
                  type="date"
                  value={newBlackoutDate}
                  onChange={(e) => setNewBlackoutDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex-1">
                <label htmlFor="blackoutReason" className="block text-sm font-medium mb-1">
                  Reason (optional)
                </label>
                <input
                  id="blackoutReason"
                  type="text"
                  value={newBlackoutReason}
                  onChange={(e) => setNewBlackoutReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit">Add</Button>
              </div>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Blackout Dates</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-500" colSpan={2}>
                        Loading...
                      </td>
                    </tr>
                  ) : blackouts.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-500" colSpan={2}>
                        No blackout dates
                      </td>
                    </tr>
                  ) : (
                    blackouts.map((blackout) => (
                      <tr key={blackout.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {blackout.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {blackout.reason || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
