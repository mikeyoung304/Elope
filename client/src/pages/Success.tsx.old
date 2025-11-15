import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, AlertCircle, Calendar, Mail, Users, Package, Plus } from "lucide-react";
import { Container } from "../ui/Container";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, baseUrl } from "../lib/api";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { LastCheckout } from "../lib/types";
import type { BookingDto, PackageDto } from "@elope/contracts";

export function Success() {
  const [searchParams] = useSearchParams();
  const [isPaid, setIsPaid] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDto | null>(null);
  const [packageData, setPackageData] = useState<PackageDto | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");
  const bookingIdParam = searchParams.get("booking_id");
  const isMockMode = import.meta.env.VITE_APP_MODE === "mock";
  const showMockButton = isMockMode && sessionId && !isPaid && !bookingDetails;

  // Fetch booking details by ID
  const fetchBooking = async (bookingId: string) => {
    setIsLoadingBooking(true);
    setBookingError(null);
    try {
      const response = await api.getBookingById({ params: { id: bookingId } });
      if (response.status === 200) {
        setBookingDetails(response.body);

        // Fetch package data to get names
        const packagesResponse = await api.getPackages();
        if (packagesResponse.status === 200) {
          const pkg = packagesResponse.body.find(p => p.id === response.body.packageId);
          if (pkg) {
            setPackageData(pkg);
          }
        }
      } else {
        setBookingError('Booking not found');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      setBookingError('Failed to load booking details');
    } finally {
      setIsLoadingBooking(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!sessionId) return;

    setIsSimulating(true);
    try {
      // Get checkout data from localStorage
      const lastCheckoutStr = localStorage.getItem('lastCheckout');
      if (!lastCheckoutStr) {
        alert('No checkout data found. Please try booking again.');
        return;
      }

      const checkoutData: LastCheckout = JSON.parse(lastCheckoutStr);

      // POST to /v1/dev/simulate-checkout-completed
      const response = await fetch(`${baseUrl}/v1/dev/simulate-checkout-completed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          packageId: checkoutData.packageId,
          eventDate: checkoutData.eventDate,
          email: checkoutData.email,
          coupleName: checkoutData.coupleName,
          addOnIds: checkoutData.addOnIds,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setIsPaid(true);
        // Clear localStorage after successful simulation
        localStorage.removeItem('lastCheckout');

        // Fetch booking details using the returned bookingId
        if (result.bookingId) {
          await fetchBooking(result.bookingId);
        }
      } else {
        alert('Failed to simulate payment. Please try again.');
      }
    } catch (error) {
      console.error('Simulation error:', error);
      alert('An error occurred during simulation. Please try again.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Fetch booking on mount if bookingId is in URL (real Stripe flow)
  useEffect(() => {
    if (bookingIdParam) {
      fetchBooking(bookingIdParam);
      setIsPaid(true);
    }
  }, [bookingIdParam]);

  // Helper to format date with proper timezone handling
  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container className="py-12 md:py-20">
      <Card className="max-w-3xl mx-auto bg-navy-800 border-navy-600 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-full transition-colors",
              bookingDetails ? "bg-navy-700" : "bg-navy-700"
            )}>
              {bookingDetails ? (
                <CheckCircle className="w-8 h-8 text-lavender-300" />
              ) : (
                <AlertCircle className="w-8 h-8 text-lavender-200" />
              )}
            </div>
          </div>
          <CardTitle className="font-heading text-4xl md:text-5xl text-lavender-50">
            {bookingDetails ? 'Booking Confirmed!' : isPaid ? 'Booking Confirmed!' : 'Almost There!'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mock Mode Button */}
          {showMockButton && (
            <div className="p-6 border border-navy-600 bg-navy-700 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-lavender-200 mt-0.5" />
                <div>
                  <p className="text-lg font-medium text-lavender-50 mb-1">
                    Mock Mode Active
                  </p>
                  <p className="text-base text-lavender-100">
                    Click below to simulate payment completion
                  </p>
                </div>
              </div>
              <Button
                onClick={handleMarkAsPaid}
                disabled={isSimulating}
                variant="outline"
                className="w-full border-navy-600 text-lavender-100 hover:bg-navy-600 text-lg h-12"
                data-testid="mock-paid"
              >
                {isSimulating ? 'Simulating...' : 'Mark as Paid (mock)'}
              </Button>
            </div>
          )}

          {/* Mock Mode Success Message */}
          {isPaid && isMockMode && !bookingDetails && (
            <div className="p-6 border border-navy-600 bg-navy-700 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-lavender-300 mt-0.5" />
                <div>
                  <p className="text-lg font-medium text-lavender-50 mb-1">
                    Payment simulation completed successfully!
                  </p>
                  <p className="text-base text-lavender-100">
                    Your booking has been created in the system.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoadingBooking && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 text-lavender-100">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <p className="text-lg">Loading booking details...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {bookingError && (
            <div className="p-6 border border-navy-600 bg-navy-700 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-lavender-200 mt-0.5" />
                <p className="text-lg font-medium text-lavender-50">{bookingError}</p>
              </div>
            </div>
          )}

          {/* Booking Details */}
          {bookingDetails && (
            <div className="space-y-8">
              {/* Success Message */}
              <div className="p-6 border border-navy-600 bg-navy-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-lavender-300 mt-0.5" />
                  <div>
                    <p className="text-lg font-medium text-lavender-50 mb-1">
                      Payment Received!
                    </p>
                    <p className="text-base text-lavender-100">
                      Thank you for your booking. We'll send you a confirmation email shortly at{' '}
                      <span className="font-medium text-lavender-50">{bookingDetails.email}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading text-2xl font-semibold mb-4 text-lavender-50">Booking Details</h2>
                  <div className="space-y-4">
                    {/* Confirmation Number */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-navy-600">
                      <span className="text-base text-lavender-100">Confirmation Number</span>
                      <span className="text-base font-mono font-medium text-lavender-50 text-right">{bookingDetails.id}</span>
                    </div>

                    {/* Couple Name */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 text-base text-lavender-100">
                        <Users className="w-5 h-5" />
                        <span>Couple Name</span>
                      </div>
                      <span className="text-base font-medium text-lavender-50 text-right">{bookingDetails.coupleName}</span>
                    </div>

                    {/* Email */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 text-base text-lavender-100">
                        <Mail className="w-5 h-5" />
                        <span>Email</span>
                      </div>
                      <span className="text-base text-lavender-50 text-right">{bookingDetails.email}</span>
                    </div>

                    {/* Event Date */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 text-base text-lavender-100">
                        <Calendar className="w-5 h-5" />
                        <span>Event Date</span>
                      </div>
                      <span className="text-base font-medium text-lavender-50 text-right">{formatEventDate(bookingDetails.eventDate)}</span>
                    </div>

                    {/* Package */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 text-base text-lavender-100">
                        <Package className="w-5 h-5" />
                        <span>Package</span>
                      </div>
                      <span className="text-base font-medium text-lavender-50 text-right">
                        {packageData ? packageData.title : bookingDetails.packageId}
                      </span>
                    </div>

                    {/* Add-ons */}
                    {bookingDetails.addOnIds.length > 0 && (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 text-base text-lavender-100">
                          <Plus className="w-5 h-5" />
                          <span>Add-ons</span>
                        </div>
                        <div className="flex flex-col gap-1.5 text-right">
                          {bookingDetails.addOnIds.map((addOnId) => {
                            const addOn = packageData?.addOns.find(a => a.id === addOnId);
                            return (
                              <span key={addOnId} className="text-base text-lavender-50">
                                {addOn ? addOn.title : addOnId}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-base text-lavender-100">Status</span>
                      <Badge variant="outline" className="text-lavender-200 border-navy-500 bg-navy-700 text-base">
                        {bookingDetails.status}
                      </Badge>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-navy-600">
                      <span className="font-medium text-lavender-50 text-xl">Total Paid</span>
                      <span className="text-3xl font-heading font-semibold text-lavender-50">
                        {formatCurrency(bookingDetails.totalCents)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Payment Message */}
          {!bookingDetails && !isLoadingBooking && !isPaid && (
            <div className="text-center py-8">
              <p className="text-lavender-100 text-lg">
                Please complete the payment to confirm your booking.
              </p>
            </div>
          )}

          {/* Help Text */}
          {!isPaid && !showMockButton && !bookingDetails && (
            <div className="text-center pt-4">
              <p className="text-base text-lavender-100">
                If you have any questions, please don't hesitate to contact us.
              </p>
            </div>
          )}
        </CardContent>

        {/* Footer with Action Button */}
        {(bookingDetails || isPaid) && (
          <CardFooter className="justify-center pt-6">
            <Button asChild className="bg-lavender-500 hover:bg-lavender-600 text-white text-xl h-14 px-8">
              <Link to="/">
                Back to Home
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </Container>
  );
}
