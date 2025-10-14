import { Container } from "../ui/Container";
import { Card } from "../ui/Card";

export function Success() {
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
        <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
        <p className="text-xl text-gray-600 mb-8">
          Thank you for your booking. We'll send you a confirmation email shortly.
        </p>
        <p className="text-gray-500">
          If you have any questions, please don't hesitate to contact us.
        </p>
      </Card>
    </Container>
  );
}
