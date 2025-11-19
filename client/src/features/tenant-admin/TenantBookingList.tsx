import { useMemo, useState } from "react";
import { Download, Loader2, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { BookingDto } from "@elope/contracts";

interface TenantBookingListProps {
  bookings: BookingDto[];
  isLoading: boolean;
}

export function TenantBookingList({ bookings, isLoading }: TenantBookingListProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const hasBookings = useMemo(() => bookings.length > 0, [bookings.length]);

  // Filter bookings by date range and status
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const eventDate = new Date(booking.eventDate);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;

      // Date range filter
      if (from && eventDate < from) return false;
      if (to && eventDate > to) return false;

      // Status filter
      if (statusFilter !== "all" && (booking as any).status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [bookings, dateFrom, dateTo, statusFilter]);

  const exportToCSV = () => {
    if (filteredBookings.length === 0) return;

    const headers = ["Couple", "Email", "Event Date", "Package", "Status", "Total"];
    const rows = filteredBookings.map((b) => [
      b.coupleName,
      b.email,
      b.eventDate,
      b.packageId,
      (b as any).status || "confirmed",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "border-green-500 bg-green-900/20 text-green-300";
      case "pending":
        return "border-yellow-500 bg-yellow-900/20 text-yellow-300";
      case "cancelled":
        return "border-red-500 bg-red-900/20 text-red-300";
      default:
        return "border-macon-navy-500 bg-macon-navy-700 text-macon-navy-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-macon-navy-300" />
          <h3 className="text-xl font-semibold text-macon-navy-50">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom" className="text-macon-navy-100 text-base">
              Event Date From
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 focus:border-macon-navy-500 h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTo" className="text-macon-navy-100 text-base">
              Event Date To
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 focus:border-macon-navy-500 h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-macon-navy-100 text-base">
              Status
            </Label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 bg-macon-navy-900 border border-macon-navy-600 text-macon-navy-50 rounded-md focus:border-macon-navy-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {(dateFrom || dateTo || statusFilter !== "all") && (
          <div className="mt-4">
            <Button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setStatusFilter("all");
              }}
              variant="outline"
              size="sm"
              className="border-macon-navy-600 text-macon-navy-100 hover:bg-macon-navy-700"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Bookings List */}
      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-macon-navy-50">
            Bookings {filteredBookings.length !== bookings.length && `(${filteredBookings.length} of ${bookings.length})`}
          </h2>
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="lg"
            disabled={filteredBookings.length === 0}
            className="border-macon-navy-600 text-macon-navy-100 hover:bg-macon-navy-700 hover:text-macon-navy-50 text-base"
          >
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-macon-navy-600 hover:bg-macon-navy-700">
              <TableHead className="text-macon-navy-100 text-lg">Couple</TableHead>
              <TableHead className="text-macon-navy-100 text-lg">Email</TableHead>
              <TableHead className="text-macon-navy-100 text-lg">Event Date</TableHead>
              <TableHead className="text-macon-navy-100 text-lg">Package</TableHead>
              <TableHead className="text-macon-navy-100 text-lg">Status</TableHead>
              <TableHead className="text-right text-macon-navy-100 text-lg">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-macon-navy-700">
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-macon-navy-300" />
                </TableCell>
              </TableRow>
            ) : !hasBookings ? (
              <TableRow className="hover:bg-macon-navy-700">
                <TableCell colSpan={6} className="text-center py-8 text-macon-navy-100 text-lg">
                  No bookings yet
                </TableCell>
              </TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow className="hover:bg-macon-navy-700">
                <TableCell colSpan={6} className="text-center py-8 text-macon-navy-100 text-lg">
                  No bookings match the current filters
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id} className="border-macon-navy-600 hover:bg-macon-navy-700">
                  <TableCell className="font-medium text-macon-navy-50 text-base">
                    {booking.coupleName}
                  </TableCell>
                  <TableCell className="text-macon-navy-100 text-base">
                    {booking.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-macon-navy-500 bg-macon-navy-700 text-macon-navy-200 text-base"
                    >
                      {new Date(booking.eventDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-macon-navy-100 text-base">
                    {booking.packageId}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusColor((booking as any).status || "confirmed")}
                    >
                      {((booking as any).status || "confirmed").charAt(0).toUpperCase() +
                        ((booking as any).status || "confirmed").slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-macon-navy-300 text-xl">
                    {formatCurrency(booking.totalCents)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
