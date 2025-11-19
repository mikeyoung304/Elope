import { useMemo } from "react";
import { Download, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface BookingListProps {
  bookings: BookingDto[];
  isLoading: boolean;
  onExportCSV: () => void;
}

export function BookingList({ bookings, isLoading, onExportCSV }: BookingListProps) {
  const hasBookings = useMemo(() => bookings.length > 0, [bookings.length]);

  return (
    <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-macon-navy-50">Bookings</h2>
        <Button
          onClick={onExportCSV}
          variant="outline"
          size="lg"
          disabled={!hasBookings}
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
            <TableHead className="text-macon-navy-100 text-lg">Date</TableHead>
            <TableHead className="text-macon-navy-100 text-lg">Package</TableHead>
            <TableHead className="text-right text-macon-navy-100 text-lg">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-macon-navy-700">
              <TableCell colSpan={4} className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-macon-navy-300" />
              </TableCell>
            </TableRow>
          ) : !hasBookings ? (
            <TableRow className="hover:bg-macon-navy-700">
              <TableCell colSpan={4} className="text-center py-8 text-macon-navy-100 text-lg">
                No bookings yet
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => (
              <TableRow key={booking.id} className="border-macon-navy-600 hover:bg-macon-navy-700">
                <TableCell className="font-medium text-macon-navy-50 text-base">
                  {booking.coupleName}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-macon-navy-500 bg-macon-navy-700 text-macon-navy-200 text-base"
                  >
                    {booking.eventDate}
                  </Badge>
                </TableCell>
                <TableCell className="text-macon-navy-100 text-base">
                  {booking.packageId}
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
  );
}
