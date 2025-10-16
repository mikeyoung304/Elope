/**
 * Atomic webhook handler with input validation
 * P0/P1 Implementation: Uses Prisma transactions + Zod validation
 */

import { PrismaClient, PaymentStatus, BookingStatus } from '../../generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const WebhookSchema = z.object({
  type: z.enum(['payment.captured', 'payment.failed', 'payment.canceled']),
  data: z.object({
    processorId: z.string(),
    bookingId: z.string(),
    amount: z.number().int().nonnegative(),
    currency: z.string().default('USD'),
  }),
});

export async function handlePaymentWebhook(raw: unknown): Promise<void> {
  // Validate webhook payload with Zod
  const parsed = WebhookSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('invalid_webhook_payload');
  }

  const { type, data } = parsed.data;

  // Map webhook type to PaymentStatus
  const status: PaymentStatus =
    type === 'payment.captured'
      ? 'CAPTURED'
      : type === 'payment.failed'
      ? 'FAILED'
      : 'CANCELED';

  // Execute within a Prisma transaction for atomicity
  await prisma.$transaction(async (tx) => {
    // Upsert payment record
    const payment = await tx.payment.upsert({
      where: { processorId: data.processorId },
      update: {
        status,
        amount: data.amount,
        currency: data.currency,
      },
      create: {
        processor: 'square',
        processorId: data.processorId,
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency,
        status,
      },
    });

    // Update booking status based on payment status
    if (payment.status === 'CAPTURED') {
      await tx.booking.update({
        where: { id: data.bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });
    } else {
      // Failed or canceled payments -> revert to PENDING
      await tx.booking.update({
        where: { id: data.bookingId },
        data: { status: BookingStatus.PENDING },
      });
    }
  });
}
