/**
 * Prisma Webhook Repository Adapter
 * Handles webhook event deduplication and tracking
 */

import type { PrismaClient } from '../../generated/prisma';
import type { WebhookRepository } from '../../lib/ports';
import { logger } from '../../lib/core/logger';

export class PrismaWebhookRepository implements WebhookRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async isDuplicate(eventId: string): Promise<boolean> {
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existing) {
      // If webhook already exists, mark as duplicate (unless it's already processed)
      if (existing.status !== 'DUPLICATE' && existing.status !== 'PROCESSED') {
        await this.prisma.webhookEvent.update({
          where: { eventId },
          data: {
            status: 'DUPLICATE',
            attempts: { increment: 1 },
          },
        });
      }
      return true;
    }

    return false;
  }

  async recordWebhook(input: {
    eventId: string;
    eventType: string;
    rawPayload: string;
  }): Promise<void> {
    try {
      await this.prisma.webhookEvent.create({
        data: {
          eventId: input.eventId,
          eventType: input.eventType,
          rawPayload: input.rawPayload,
          status: 'PENDING',
          attempts: 1,
        },
      });

      logger.info({ eventId: input.eventId, eventType: input.eventType }, 'Webhook event recorded');
    } catch (error) {
      // If unique constraint violation, it's a race condition - webhook already exists
      logger.warn({ eventId: input.eventId }, 'Webhook already recorded (race condition)');
    }
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { eventId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    logger.info({ eventId }, 'Webhook marked as processed');
  }

  async markFailed(eventId: string, errorMessage: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { eventId },
      data: {
        status: 'FAILED',
        lastError: errorMessage,
        attempts: { increment: 1 },
      },
    });

    logger.error({ eventId, error: errorMessage }, 'Webhook marked as failed');
  }
}
