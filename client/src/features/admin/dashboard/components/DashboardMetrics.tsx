import { Calendar, DollarSign, Package, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { PackageDto } from "@macon/contracts";

interface DashboardMetricsProps {
  totalBookings: number;
  totalRevenue: number;
  packagesCount: number;
  blackoutsCount: number;
}

/**
 * DashboardMetrics Component
 *
 * Displays key metrics cards for the admin dashboard
 */
export function DashboardMetrics({
  totalBookings,
  totalRevenue,
  packagesCount,
  blackoutsCount,
}: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-macon-navy-700 rounded">
            <Calendar className="w-5 h-5 text-macon-navy-300" />
          </div>
          <div className="text-base text-macon-navy-100">Total Bookings</div>
        </div>
        <div className="text-4xl font-bold text-macon-navy-50">{totalBookings}</div>
      </Card>

      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-macon-navy-700 rounded">
            <DollarSign className="w-5 h-5 text-macon-navy-300" />
          </div>
          <div className="text-base text-macon-navy-100">Total Revenue</div>
        </div>
        <div className="text-4xl font-bold text-macon-navy-300">
          {formatCurrency(totalRevenue)}
        </div>
      </Card>

      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-macon-navy-700 rounded">
            <Package className="w-5 h-5 text-macon-navy-300" />
          </div>
          <div className="text-base text-macon-navy-100">Total Packages</div>
        </div>
        <div className="text-4xl font-bold text-macon-navy-50">{packagesCount}</div>
      </Card>

      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-macon-navy-700 rounded">
            <XCircle className="w-5 h-5 text-macon-navy-300" />
          </div>
          <div className="text-base text-macon-navy-100">Blackout Dates</div>
        </div>
        <div className="text-4xl font-bold text-macon-navy-300">{blackoutsCount}</div>
      </Card>
    </div>
  );
}
