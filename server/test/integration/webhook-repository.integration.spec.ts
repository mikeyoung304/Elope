/**
 * Integration tests for PrismaWebhookRepository
 * Tests idempotency, race conditions, status transitions
 *
 * Setup: Requires test database
 * Run: npm run test:integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '../../src/generated/prisma';
import { PrismaWebhookRepository } from '../../src/adapters/prisma/webhook.repository';

describe('PrismaWebhookRepository - Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaWebhookRepository;

  beforeEach(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
        },
      },
    });
    repository = new PrismaWebhookRepository(prisma);
    await prisma.webhookEvent.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('Idempotency', () => {
    it('should record webhook successfully', async () => {
      const webhook = {
        eventId: 'evt_test_12345',
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify({ data: 'test' }),
      };

      await repository.recordWebhook(webhook);

      const event = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_test_12345' },
      });

      expect(event).not.toBeNull();
      expect(event?.eventId).toBe('evt_test_12345');
      expect(event?.eventType).toBe('checkout.session.completed');
      expect(event?.status).toBe('PENDING');
      expect(event?.attempts).toBe(1);
    });

    it('should detect duplicate webhooks', async () => {
      const webhook = {
        eventId: 'evt_test_duplicate',
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify({ data: 'test' }),
      };

      // Record first webhook
      await repository.recordWebhook(webhook);

      // Check if duplicate
      const isDupe = await repository.isDuplicate('evt_test_duplicate');
      expect(isDupe).toBe(true);

      // Verify status updated to DUPLICATE
      const event = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_test_duplicate' },
      });
      expect(event?.status).toBe('DUPLICATE');
      expect(event?.attempts).toBeGreaterThanOrEqual(1);
    });

    it('should return false for non-existent webhook', async () => {
      const isDupe = await repository.isDuplicate('evt_non_existent');
      expect(isDupe).toBe(false);
    });

    it('should handle concurrent duplicate checks', async () => {
      const webhook = {
        eventId: 'evt_concurrent_789',
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify({ data: 'concurrent' }),
      };

      await repository.recordWebhook(webhook);

      // Multiple duplicate checks simultaneously
      const checks = await Promise.all([
        repository.isDuplicate('evt_concurrent_789'),
        repository.isDuplicate('evt_concurrent_789'),
        repository.isDuplicate('evt_concurrent_789'),
      ]);

      // All should return true (duplicate)
      expect(checks.every(c => c === true)).toBe(true);

      // Verify final state
      const event = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_concurrent_789' },
      });
      expect(event?.status).toBe('DUPLICATE');
    });

    it('should not mark already processed webhook as duplicate', async () => {
      const webhook = {
        eventId: 'evt_already_processed',
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify({ data: 'test' }),
      };

      // Record and process webhook
      await repository.recordWebhook(webhook);
      await repository.markProcessed('evt_already_processed');

      // Check duplicate - should still return true but not change status
      const isDupe = await repository.isDuplicate('evt_already_processed');
      expect(isDupe).toBe(true);

      // Verify status remains PROCESSED
      const event = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_already_processed' },
      });
      expect(event?.status).toBe('PROCESSED');
    });

    it('should handle race condition on webhook recording', async () => {
      const webhook = {
        eventId: 'evt_race_condition',
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify({ data: 'race' }),
      };

      // Try to record same webhook simultaneously
      // Using Promise.allSettled to handle race condition rejections gracefully
      const results = await Promise.allSettled([
        repository.recordWebhook(webhook),
        repository.recordWebhook(webhook),
        repository.recordWebhook(webhook),
      ]);

      // At least one should succeed (the first one)
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      // Should only have one record in database
      const events = await prisma.webhookEvent.findMany({
        where: { eventId: 'evt_race_condition' },
      });

      expect(events.length).toBe(1);
      expect(events[0].status).toBe('PENDING');
    });
  });

  describe('Status Transitions', () => {
    it('should mark webhook as PROCESSED', async () => {
      await repository.recordWebhook({
        eventId: 'evt_process_456',
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify({ data: 'process' }),
      });

      await repository.markProcessed('evt_process_456');

      const event = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_process_456' },
      });

      expect(event?.status).toBe('PROCESSED');
      expect(event?.processedAt).not.toBeNull();
    });

    it('should mark webhook as FAILED with error message', async () => {
      await repository.recordWebhook({
        eventId: 'evt_fail_999',
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify({ data: 'fail' }),
      });

      const errorMsg = 'Database connection timeout';
      await repository.markFailed('evt_fail_999', errorMsg);

      const event = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_fail_999' },
      });

      expect(event?.status).toBe('FAILED');
      expect(event?.lastError).toBe(errorMsg);
      expect(event?.attempts).toBeGreaterThanOrEqual(1);
    });

    it('should increment attempts on failure', async () => {
      await repository.recordWebhook({
        eventId: 'evt_retry_test',
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify({ data: 'retry' }),
      });

      // Get initial attempts
      const initial = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_retry_test' },
      });
      const initialAttempts = initial?.attempts || 0;

      // Mark as failed
      await repository.markFailed('evt_retry_test', 'First failure');

      const afterFirst = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_retry_test' },
      });

      expect(afterFirst?.attempts).toBe(initialAttempts + 1);
      expect(afterFirst?.status).toBe('FAILED');
      expect(afterFirst?.lastError).toBe('First failure');

      // Mark as failed again
      await repository.markFailed('evt_retry_test', 'Second failure');

      const afterSecond = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_retry_test' },
      });

      expect(afterSecond?.attempts).toBe(initialAttempts + 2);
      expect(afterSecond?.lastError).toBe('Second failure');
    });

    it('should transition from PENDING to PROCESSED', async () => {
      const eventId = 'evt_transition_pending_processed';

      await repository.recordWebhook({
        eventId,
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify({ data: 'transition' }),
      });

      // Verify PENDING
      let event = await prisma.webhookEvent.findUnique({
        where: { eventId },
      });
      expect(event?.status).toBe('PENDING');
      expect(event?.processedAt).toBeNull();

      // Transition to PROCESSED
      await repository.markProcessed(eventId);

      // Verify PROCESSED
      event = await prisma.webhookEvent.findUnique({
        where: { eventId },
      });
      expect(event?.status).toBe('PROCESSED');
      expect(event?.processedAt).not.toBeNull();
    });

    it('should transition from PENDING to FAILED', async () => {
      const eventId = 'evt_transition_pending_failed';

      await repository.recordWebhook({
        eventId,
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify({ data: 'transition' }),
      });

      // Verify PENDING
      let event = await prisma.webhookEvent.findUnique({
        where: { eventId },
      });
      expect(event?.status).toBe('PENDING');
      expect(event?.lastError).toBeNull();

      // Transition to FAILED
      const errorMessage = 'Booking creation failed';
      await repository.markFailed(eventId, errorMessage);

      // Verify FAILED
      event = await prisma.webhookEvent.findUnique({
        where: { eventId },
      });
      expect(event?.status).toBe('FAILED');
      expect(event?.lastError).toBe(errorMessage);
    });
  });

  describe('Data Integrity', () => {
    it('should store complete raw payload', async () => {
      const complexPayload = {
        id: 'evt_complex',
        object: 'event',
        data: {
          object: {
            id: 'cs_test_123',
            amount_total: 250000,
            metadata: {
              packageId: 'classic',
              eventDate: '2026-12-25',
            },
          },
        },
        type: 'checkout.session.completed',
      };

      await repository.recordWebhook({
        eventId: 'evt_complex',
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify(complexPayload),
      });

      const event = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_complex' },
      });

      expect(event?.rawPayload).toBe(JSON.stringify(complexPayload));

      // Verify payload can be parsed back
      const parsed = JSON.parse(event?.rawPayload || '{}');
      expect(parsed.data.object.id).toBe('cs_test_123');
      expect(parsed.data.object.amount_total).toBe(250000);
    });

    it('should store different event types', async () => {
      const eventTypes = [
        'checkout.session.completed',
        'checkout.session.expired',
        'payment_intent.succeeded',
        'charge.refunded',
      ];

      for (const eventType of eventTypes) {
        await repository.recordWebhook({
          eventId: `evt_${eventType}`,
          eventType,
          rawPayload: JSON.stringify({ type: eventType }),
        });
      }

      const events = await prisma.webhookEvent.findMany();
      expect(events.length).toBe(4);

      const types = events.map(e => e.eventType).sort();
      expect(types).toEqual(eventTypes.sort());
    });

    it('should maintain timestamps correctly', async () => {
      const eventId = 'evt_timestamp_test';

      await repository.recordWebhook({
        eventId,
        eventType: 'checkout.session.completed',
        rawPayload: JSON.stringify({ data: 'timestamp' }),
      });

      const initial = await prisma.webhookEvent.findUnique({
        where: { eventId },
      });

      expect(initial?.createdAt).toBeInstanceOf(Date);
      expect(initial?.processedAt).toBeNull();

      // Wait a bit before marking processed
      await new Promise(resolve => setTimeout(resolve, 100));

      await repository.markProcessed(eventId);

      const processed = await prisma.webhookEvent.findUnique({
        where: { eventId },
      });

      expect(processed?.processedAt).toBeInstanceOf(Date);
      expect(processed?.processedAt!.getTime()).toBeGreaterThan(
        processed?.createdAt.getTime() || 0
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty payload', async () => {
      await repository.recordWebhook({
        eventId: 'evt_empty_payload',
        eventType: 'test.event',
        rawPayload: '',
      });

      const event = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_empty_payload' },
      });

      expect(event?.rawPayload).toBe('');
    });

    it('should handle very long error messages', async () => {
      const eventId = 'evt_long_error';
      const longError = 'Error: ' + 'x'.repeat(1000);

      await repository.recordWebhook({
        eventId,
        eventType: 'test.event',
        rawPayload: JSON.stringify({ data: 'test' }),
      });

      await repository.markFailed(eventId, longError);

      const event = await prisma.webhookEvent.findUnique({
        where: { eventId },
      });

      expect(event?.lastError).toBe(longError);
    });

    it('should handle special characters in event IDs', async () => {
      const specialEventId = 'evt_test_special-chars_123.456';

      await repository.recordWebhook({
        eventId: specialEventId,
        eventType: 'test.event',
        rawPayload: JSON.stringify({ data: 'special' }),
      });

      const event = await prisma.webhookEvent.findUnique({
        where: { eventId: specialEventId },
      });

      expect(event?.eventId).toBe(specialEventId);
    });
  });
});
