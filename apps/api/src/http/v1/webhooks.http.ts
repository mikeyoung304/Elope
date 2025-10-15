/**
 * Webhooks HTTP controller
 * NOTE: This route requires raw body parsing (not JSON)
 */

import type { PaymentProvider } from '../../domains/payments/port';
import type { BookingService } from '../../domains/booking/service';
import { logger } from '../../core/logger';

interface StripeCheckoutSession {
  id: string;
  metadata: {
    packageId: string;
    eventDate: string;
    email: string;
    coupleName: string;
    addOnIds?: string;
  };
  amount_total: number;
}

interface StripeEvent {
  type: string;
  data: {
    object: StripeCheckoutSession;
  };
}

export class WebhooksController {
  constructor(
    private readonly paymentProvider: PaymentProvider,
    private readonly bookingService: BookingService
  ) {}

  async handleStripeWebhook(rawBody: string, signature: string): Promise<void> {
    // Verify webhook signature
    const event = (await this.paymentProvider.verifyWebhook(rawBody, signature)) as StripeEvent;

    logger.info({ type: event.type }, 'Stripe webhook received');

    // Process checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Extract metadata
      const { packageId, eventDate, email, coupleName, addOnIds } = session.metadata;

      // Parse add-on IDs if present
      const parsedAddOnIds = addOnIds ? JSON.parse(addOnIds) : [];

      // Calculate total from Stripe session (in cents)
      const totalCents = session.amount_total ?? 0;

      logger.info(
        {
          sessionId: session.id,
          packageId,
          eventDate,
          email,
        },
        'Processing checkout completion'
      );

      // Create booking in database
      await this.bookingService.onPaymentCompleted({
        sessionId: session.id,
        packageId,
        eventDate,
        email,
        coupleName,
        addOnIds: parsedAddOnIds,
        totalCents,
      });

      logger.info({ sessionId: session.id }, 'Booking created successfully');
    } else {
      logger.info({ type: event.type }, 'Ignoring unhandled webhook event type');
    }
  }
}
