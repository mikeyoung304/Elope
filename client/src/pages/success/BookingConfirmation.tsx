import { Calendar, Mail, Users, Package, Plus, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { BookingDto, PackageDto } from "@elope/contracts";

interface BookingConfirmationProps {
  booking: BookingDto;
  packageData: PackageDto | null;
}

/**
 * BookingConfirmation - Displays detailed booking information after successful payment
 * Includes confirmation message, booking details, package info, and add-ons
 */
export function BookingConfirmation({
  booking,
  packageData,
}: BookingConfirmationProps) {
  // Helper to format date with proper timezone handling
  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Success Message */}
      <div className="p-6 border border-macon-navy-600 bg-macon-navy-700 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-macon-navy-300 mt-0.5" />
          <div>
            <p className="text-lg font-medium text-macon-navy-50 mb-1">
              Payment Received!
            </p>
            <p className="text-base text-macon-navy-100">
              Thank you for your booking. We'll send you a confirmation email
              shortly at{" "}
              <span className="font-medium text-macon-navy-50">
                {booking.email}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Booking Information */}
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold mb-4 text-macon-navy-50">
            Booking Details
          </h2>
          <div className="space-y-4">
            {/* Confirmation Number */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-macon-navy-600">
              <span className="text-base text-macon-navy-100">
                Confirmation Number
              </span>
              <span className="text-base font-mono font-medium text-macon-navy-50 text-right">
                {booking.id}
              </span>
            </div>

            {/* Couple Name */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-base text-macon-navy-100">
                <Users className="w-5 h-5" />
                <span>Couple Name</span>
              </div>
              <span className="text-base font-medium text-macon-navy-50 text-right">
                {booking.coupleName}
              </span>
            </div>

            {/* Email */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-base text-macon-navy-100">
                <Mail className="w-5 h-5" />
                <span>Email</span>
              </div>
              <span className="text-base text-macon-navy-50 text-right">
                {booking.email}
              </span>
            </div>

            {/* Event Date */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-base text-macon-navy-100">
                <Calendar className="w-5 h-5" />
                <span>Event Date</span>
              </div>
              <span className="text-base font-medium text-macon-navy-50 text-right">
                {formatEventDate(booking.eventDate)}
              </span>
            </div>

            {/* Package */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-base text-macon-navy-100">
                <Package className="w-5 h-5" />
                <span>Package</span>
              </div>
              <span className="text-base font-medium text-macon-navy-50 text-right">
                {packageData ? packageData.title : booking.packageId}
              </span>
            </div>

            {/* Add-ons */}
            {booking.addOnIds.length > 0 && (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-base text-macon-navy-100">
                  <Plus className="w-5 h-5" />
                  <span>Add-ons</span>
                </div>
                <div className="flex flex-col gap-1.5 text-right">
                  {booking.addOnIds.map((addOnId) => {
                    const addOn = packageData?.addOns.find(
                      (a) => a.id === addOnId
                    );
                    return (
                      <span key={addOnId} className="text-base text-macon-navy-50">
                        {addOn ? addOn.title : addOnId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-start justify-between gap-4">
              <span className="text-base text-macon-navy-100">Status</span>
              <Badge
                variant="outline"
                className="text-macon-navy-200 border-macon-navy-500 bg-macon-navy-700 text-base"
              >
                {booking.status}
              </Badge>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-macon-navy-600">
              <span className="font-medium text-macon-navy-50 text-xl">
                Total Paid
              </span>
              <span className="text-3xl font-heading font-semibold text-macon-navy-50">
                {formatCurrency(booking.totalCents)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
