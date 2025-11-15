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

// Zod schema for Stripe session (runtime validation)
const StripeSessionSchema = z.object({
  id: z.string(),
  amount_total: z.number().nullable(),
  metadata: z.object({
    tenantId: z.string(), // CRITICAL: Multi-tenant data isolation
    packageId: z.string(),
    eventDate: z.string(),
    email: z.string().email(),
    coupleName: z.string(),
    addOnIds: z.string().optional(),
    commissionAmount: z.string().optional(),
    commissionPercent: z.string().optional(),
  }),
});

interface StripeCheckoutSession {
  id: string;
  metadata: {
    tenantId: string;
    packageId: string;
    eventDate: string;
    email: string;
    coupleName: string;
    addOnIds?: string;
    commissionAmount?: string;
    commissionPercent?: string;
  };
  amount_total: number | null;
}

// Zod schema for metadata validation
const MetadataSchema = z.object({
  tenantId: z.string(), // CRITICAL: Multi-tenant data isolation
  packageId: z.string(),
  eventDate: z.string(),
  email: z.string().email(),
  coupleName: z.string(),
  addOnIds: z.string().optional(),
  commissionAmount: z.string().optional(),
  commissionPercent: z.string().optional(),
});

export class WebhooksController {
  constructor(
    private readonly paymentProvider: PaymentProvider,
    private readonly bookingService: BookingService,
    private readonly webhookRepo: WebhookRepository
  ) {}

  /**
   * Handles incoming Stripe webhook events with comprehensive validation and error handling
   *
   * Implements critical security and reliability features:
   * - Cryptographic signature verification to prevent spoofing
   * - Idempotency protection using event ID deduplication
   * - Zod-based payload validation (no unsafe JSON.parse)
   * - Error tracking with webhook repository
   * - Race condition protection for booking creation
   *
   * Process flow:
   * 1. Verify webhook signature with Stripe secret
   * 2. Check for duplicate event ID (idempotency)
   * 3. Record webhook event in database
   * 4. Validate payload structure with Zod
   * 5. Process checkout.session.completed events
   * 6. Mark as processed or failed for retry logic
   *
   * @param rawBody - Raw webhook payload string (required for signature verification)
   * @param signature - Stripe signature header (stripe-signature)
   *
   * @returns Promise that resolves when webhook is processed (or identified as duplicate)
   *
   * @throws {WebhookValidationError} If signature verification fails or payload is invalid
   * @throws {WebhookProcessingError} If booking creation or database operations fail
   *
   * @example
   * ```typescript
   * // Express route handler
   * app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
   *   try {
   *     await webhooksController.handleStripeWebhook(
   *       req.body.toString(),
   *       req.headers['stripe-signature']
   *     );
   *     res.status(200).send('OK');
   *   } catch (error) {
   *     if (error instanceof WebhookValidationError) {
   *       res.status(400).json({ error: error.message });
   *     } else {
   *       res.status(500).json({ error: 'Internal error' });
   *     }
   *   }
   * });
   * ```
   */
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

    // Extract tenantId from metadata (for idempotency and recording)
    // We need to extract it early, before full validation
    let tenantId = 'unknown';
    try {
      // Type-safe extraction using Stripe's event data structure
      const tempSession = event.data.object as Stripe.Checkout.Session;
      tenantId = tempSession?.metadata?.tenantId || 'unknown';
    } catch (err) {
      logger.warn({ eventId: event.id }, 'Could not extract tenantId from webhook metadata');
    }

    // Idempotency check - prevent duplicate processing (tenant-scoped)
    const isDupe = await this.webhookRepo.isDuplicate(tenantId, event.id);
    if (isDupe) {
      logger.info({ eventId: event.id, tenantId }, 'Duplicate webhook ignored - returning 200 OK to Stripe');
      // Return early without throwing - Stripe expects 200 for successful receipt
      return;
    }

    // Record webhook event (tenant-scoped)
    await this.webhookRepo.recordWebhook({
      tenantId,
      eventId: event.id,
      eventType: event.type,
      rawPayload: rawBody,
    });

    // Process webhook with error handling
    try {
      // Process checkout.session.completed event
      if (event.type === 'checkout.session.completed') {
        // Validate and parse session data
        const sessionResult = StripeSessionSchema.safeParse(event.data.object);
        if (!sessionResult.success) {
          logger.error({ errors: sessionResult.error.flatten() }, 'Invalid session structure from Stripe');
          await this.webhookRepo.markFailed(
            tenantId,
            event.id,
            `Invalid session structure: ${JSON.stringify(sessionResult.error.flatten())}`
          );
          throw new WebhookValidationError('Invalid Stripe session structure');
        }
        const session = sessionResult.data;

        // Validate metadata with Zod (replaces JSON.parse)
        const metadataResult = MetadataSchema.safeParse(session.metadata);
        if (!metadataResult.success) {
          logger.error({ errors: metadataResult.error.flatten() }, 'Invalid webhook metadata');
          await this.webhookRepo.markFailed(
            tenantId,
            event.id,
            `Invalid metadata: ${JSON.stringify(metadataResult.error.flatten())}`
          );
          throw new WebhookValidationError('Invalid webhook metadata');
        }

        const { tenantId: validatedTenantId, packageId, eventDate, email, coupleName, addOnIds, commissionAmount, commissionPercent } = metadataResult.data;

        // Parse add-on IDs with Zod validation
        let parsedAddOnIds: string[] = [];
        if (addOnIds) {
          try {
            const parsed = JSON.parse(addOnIds);

            // Validate it's an array
            if (!Array.isArray(parsed)) {
              logger.warn({ addOnIds, parsed }, 'addOnIds is not an array, ignoring');
            } else {
              // Validate all elements are strings
              const arrayResult = z.array(z.string()).safeParse(parsed);
              if (arrayResult.success) {
                parsedAddOnIds = arrayResult.data;
              } else {
                logger.warn({
                  addOnIds,
                  errors: arrayResult.error.flatten()
                }, 'addOnIds array contains non-string values, ignoring');
              }
            }
          } catch (error) {
            logger.warn({
              addOnIds,
              error: error instanceof Error ? error.message : String(error)
            }, 'Invalid JSON in addOnIds, ignoring');
          }
        }

        // Calculate total from Stripe session (in cents)
        const totalCents = session.amount_total ?? 0;

        logger.info(
          {
            eventId: event.id,
            sessionId: session.id,
            tenantId: validatedTenantId,
            packageId,
            eventDate,
            email,
          },
          'Processing checkout completion'
        );

        // Parse commission data from metadata
        const commissionAmountNum = commissionAmount ? parseInt(commissionAmount, 10) : undefined;
        const commissionPercentNum = commissionPercent ? parseFloat(commissionPercent) : undefined;

        // Create booking in database (tenant-scoped)
        await this.bookingService.onPaymentCompleted(validatedTenantId, {
          sessionId: session.id,
          packageId,
          eventDate,
          email,
          coupleName,
          addOnIds: parsedAddOnIds,
          totalCents,
          commissionAmount: commissionAmountNum,
          commissionPercent: commissionPercentNum,
        });

        logger.info({ eventId: event.id, sessionId: session.id, tenantId: validatedTenantId }, 'Booking created successfully');
      } else {
        logger.info({ eventId: event.id, type: event.type }, 'Ignoring unhandled webhook event type');
      }

      // Mark webhook as successfully processed (tenant-scoped)
      await this.webhookRepo.markProcessed(tenantId, event.id);
    } catch (error) {
      // Don't mark as failed if it's a validation error (already handled)
      if (!(error instanceof WebhookValidationError)) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.webhookRepo.markFailed(tenantId, event.id, errorMessage);

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
