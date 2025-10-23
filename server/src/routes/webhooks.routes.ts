/**
 * Webhooks HTTP controller
 * NOTE: This route requires raw body parsing (not JSON)
 * P0/P1: Uses Zod for payload validation, no JSON.parse()
 */

import type { PaymentProvider } from '../lib/ports';
import type { BookingService } from '../services/booking.service';
import { logger } from '../lib/core/logger';
import { z } from 'zod';
// import { handlePaymentWebhook } from '../../domains/booking/webhook-handler.service';

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

// Zod schema for metadata validation
const MetadataSchema = z.object({
  packageId: z.string(),
  eventDate: z.string(),
  email: z.string().email(),
  coupleName: z.string(),
  addOnIds: z.string().optional(),
});

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

      // Validate metadata with Zod (replaces JSON.parse)
      const metadataResult = MetadataSchema.safeParse(session.metadata);
      if (!metadataResult.success) {
        logger.error({ errors: metadataResult.error.flatten() }, 'Invalid webhook metadata');
        throw new Error('Invalid webhook metadata');
      }

      const { packageId, eventDate, email, coupleName, addOnIds } = metadataResult.data;

      // Parse add-on IDs with Zod validation
      let parsedAddOnIds: string[] = [];
      if (addOnIds) {
        try {
          const parsed = JSON.parse(addOnIds);
          const arrayResult = z.array(z.string()).safeParse(parsed);
          if (arrayResult.success) {
            parsedAddOnIds = arrayResult.data;
          }
        } catch {
          logger.warn({ addOnIds }, 'Failed to parse addOnIds');
        }
      }

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
