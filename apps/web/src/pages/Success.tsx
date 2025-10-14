import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Container } from "../ui/Container";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import type { LastCheckout } from "../lib/types";

export function Success() {
  const [searchParams] = useSearchParams();
  const [isPaid, setIsPaid] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const sessionId = searchParams.get("session_id");
  const isMockMode = import.meta.env.VITE_APP_MODE === "mock";
  const showMockButton = isMockMode && sessionId && !isPaid;

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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/v1/dev/simulate-checkout-completed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      if (response.status === 204) {
        setIsPaid(true);
        // Clear localStorage after successful simulation
        localStorage.removeItem('lastCheckout');
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

  return (
    <Container className="py-12">
      <Card className="max-w-2xl mx-auto p-12 text-center">
        <div className="mb-6">
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

        {isPaid && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold mb-2">
              Payment simulation completed successfully!
            </p>
            <p className="text-green-700 text-sm">
              Your booking has been created in the system.
            </p>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-4">
          {isPaid ? 'Booking Confirmed!' : 'Almost There!'}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {isPaid
            ? "Thank you for your booking. We'll send you a confirmation email shortly."
            : "Please complete the payment to confirm your booking."}
        </p>

        {isPaid && (
          <Link to="/">
            <Button className="mt-4">
              Back to Home
            </Button>
          </Link>
        )}

        {!isPaid && !showMockButton && (
          <p className="text-gray-500">
            If you have any questions, please don't hesitate to contact us.
          </p>
        )}
      </Card>
    </Container>
  );
}
