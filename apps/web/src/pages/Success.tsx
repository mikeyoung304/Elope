import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Container } from "../ui/Container";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { api, baseUrl } from "../lib/api";
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

  // Helper to format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container className="py-12">
      <Card className="max-w-2xl mx-auto p-12">
        <div className="mb-6 text-center">
          <svg
            className="mx-auto h-16 w-16 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {showMockButton && (
          <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-4">
              <strong>Mock Mode:</strong> Click below to simulate payment completion
            </p>
            <Button
              onClick={handleMarkAsPaid}
              disabled={isSimulating}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isSimulating ? 'Simulating...' : 'Mark as Paid (mock)'}
            </Button>
          </div>
        )}

        {isPaid && isMockMode && !bookingDetails && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold mb-2">
              Payment simulation completed successfully!
            </p>
            <p className="text-green-700 text-sm">
              Your booking has been created in the system.
            </p>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-4 text-center">
          {bookingDetails ? 'Booking Confirmed!' : isPaid ? 'Booking Confirmed!' : 'Almost There!'}
        </h1>

        {isLoadingBooking && (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        )}

        {bookingError && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">{bookingError}</p>
          </div>
        )}

        {bookingDetails && (
          <div className="space-y-6 text-left">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-800 font-semibold mb-2">
                Payment Received!
              </p>
              <p className="text-green-700 text-sm">
                Thank you for your booking. We'll send you a confirmation email shortly at{' '}
                <strong>{bookingDetails.email}</strong>
              </p>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmation Number:</span>
                  <span className="font-mono font-semibold">{bookingDetails.id}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Couple Name:</span>
                  <span className="font-semibold">{bookingDetails.coupleName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span>{bookingDetails.email}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Event Date:</span>
                  <span className="font-semibold">{formatDate(bookingDetails.eventDate)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Package:</span>
                  <span className="font-semibold">
                    {packageData ? packageData.title : bookingDetails.packageId}
                  </span>
                </div>

                {bookingDetails.addOnIds.length > 0 && (
                  <div>
                    <span className="text-gray-600">Add-ons:</span>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {bookingDetails.addOnIds.map((addOnId) => {
                        const addOn = packageData?.addOns.find(a => a.id === addOnId);
                        return (
                          <li key={addOnId}>
                            {addOn ? addOn.title : addOnId}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <span className="text-lg font-semibold">Total Paid:</span>
                  <span className="text-lg font-bold text-green-700">
                    {formatCurrency(bookingDetails.totalCents)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                    {bookingDetails.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!bookingDetails && !isLoadingBooking && !isPaid && (
          <p className="text-xl text-gray-600 mb-8 text-center">
            Please complete the payment to confirm your booking.
          </p>
        )}

        {(bookingDetails || isPaid) && (
          <div className="mt-8 text-center">
            <Link to="/">
              <Button className="mt-4">
                Back to Home
              </Button>
            </Link>
          </div>
        )}

        {!isPaid && !showMockButton && !bookingDetails && (
          <p className="text-gray-500 text-center">
            If you have any questions, please don't hesitate to contact us.
          </p>
        )}
      </Card>
    </Container>
  );
}
