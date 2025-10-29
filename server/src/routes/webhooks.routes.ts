/**
 * Webhooks HTTP controller
 * NOTE: This route requires raw body parsing (not JSON)
 * P0/P1: Uses Zod for payload validation, no JSON.parse()
 */

import type { PaymentProvider, WebhookRepository } from '../lib/ports';
import type { BookingService } from '../services/booking.service';
import { logger } from '../lib/core/logger';
import {
  WebhookValidationError,
  WebhookProcessingError,
} from '../lib/errors';
import { z } from 'zod';
import type Stripe from 'stripe';

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
    private readonly bookingService: BookingService,
    private readonly webhookRepo: WebhookRepository
  ) {}

  async handleStripeWebhook(rawBody: string, signature: string): Promise<void> {
    let event: Stripe.Event;

    // Verify webhook signature
    try {
      event = await this.paymentProvider.verifyWebhook(rawBody, signature);
    } catch (error) {
      logger.error({ error }, 'Webhook signature verification failed');
      throw new WebhookValidationError('Invalid webhook signature');
    }

    logger.info({ eventId: event.id, type: event.type }, 'Stripe webhook received');

    // Idempotency check - prevent duplicate processing
    const isDupe = await this.webhookRepo.isDuplicate(event.id);
    if (isDupe) {
      logger.info({ eventId: event.id }, 'Duplicate webhook ignored - returning 200 OK to Stripe');
      // Return early without throwing - Stripe expects 200 for successful receipt
      return;
    }

    // Record webhook event
    await this.webhookRepo.recordWebhook({
      eventId: event.id,
      eventType: event.type,
      rawPayload: rawBody,
    });

    // Process webhook with error handling
    try {
      // Process checkout.session.completed event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as unknown as StripeCheckoutSession;

        // Validate metadata with Zod (replaces JSON.parse)
        const metadataResult = MetadataSchema.safeParse(session.metadata);
        if (!metadataResult.success) {
          logger.error({ errors: metadataResult.error.flatten() }, 'Invalid webhook metadata');
          await this.webhookRepo.markFailed(
            event.id,
            `Invalid metadata: ${JSON.stringify(metadataResult.error.flatten())}`
          );
          throw new WebhookValidationError('Invalid webhook metadata');
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
            eventId: event.id,
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

        logger.info({ eventId: event.id, sessionId: session.id }, 'Booking created successfully');
      } else {
        logger.info({ eventId: event.id, type: event.type }, 'Ignoring unhandled webhook event type');
      }

      // Mark webhook as successfully processed
      await this.webhookRepo.markProcessed(event.id);
    } catch (error) {
      // Don't mark as failed if it's a validation error (already handled)
      if (!(error instanceof WebhookValidationError)) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.webhookRepo.markFailed(event.id, errorMessage);

        logger.error(
          {
            eventId: event.id,
            eventType: event.type,
            error: errorMessage,
          },
          'Webhook processing failed'
        );

        throw new WebhookProcessingError(errorMessage);
      }

      // Re-throw validation error for proper HTTP response handling
      throw error;
    }
  }
}
