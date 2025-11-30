/**
 * MetricsCards Component
 *
 * Displays dashboard metrics in card format
 */

import { Package, XCircle, Calendar, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricsCardsProps {
  packagesCount: number;
  blackoutsCount: number;
  bookingsCount: number;
  hasBranding: boolean;
}

export function MetricsCards({
  packagesCount,
  blackoutsCount,
  bookingsCount,
  hasBranding,
}: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-6 border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-macon-navy-50 rounded-lg">
            <Package className="w-6 h-6 text-macon-navy-600" />
          </div>
          <div className="text-sm font-medium text-neutral-700">Total Packages</div>
        </div>
        <div className="text-3xl font-bold text-neutral-900">{packagesCount}</div>
      </Card>

      <Card className="p-6 border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-macon-orange-50 rounded-lg">
            <XCircle className="w-6 h-6 text-macon-orange-600" />
          </div>
          <div className="text-sm font-medium text-neutral-700">Blackout Dates</div>
        </div>
        <div className="text-3xl font-bold text-neutral-900">{blackoutsCount}</div>
      </Card>

      <Card className="p-6 border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-macon-navy-50 rounded-lg">
            <Calendar className="w-6 h-6 text-macon-navy-600" />
          </div>
          <div className="text-sm font-medium text-neutral-700">Total Bookings</div>
        </div>
        <div className="text-3xl font-bold text-neutral-900">{bookingsCount}</div>
      </Card>

      <Card className="p-6 border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-macon-orange-50 rounded-lg">
            <Palette className="w-6 h-6 text-macon-orange-600" />
          </div>
          <div className="text-sm font-medium text-neutral-700">Branding</div>
        </div>
        <div className="text-lg font-medium text-neutral-600">
          {hasBranding ? "Configured" : "Not Set"}
        </div>
      </Card>
    </div>
  );
}