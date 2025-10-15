/**
 * Dev-only controller for mock mode simulators
 */

import { toUtcMidnight } from '@elope/shared';
import type { BookingService } from '../../domains/booking/service';
import type { CatalogRepository } from '../../domains/catalog/port';
import { getMockState } from '../../adapters/mock';
import { logger } from '../../core/logger';

export class DevController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly catalogRepo: CatalogRepository
  ) {}

  /**
   * Simulate a completed checkout without going through Stripe
   */
  async simulateCheckoutCompleted(input: {
    sessionId: string;
    packageId: string;
    eventDate: string;
    email: string;
    coupleName: string;
    addOnIds?: string[];
  }): Promise<{ bookingId: string }> {
    logger.info({
      sessionId: input.sessionId,
      packageId: input.packageId,
      eventDate: input.eventDate,
    }, '🧪 Simulating checkout completion');

    // Normalize date
    const normalizedDate = toUtcMidnight(input.eventDate);

    // Get package to calculate total
    const pkg = await this.catalogRepo.getPackageBySlug(input.packageId);
    if (!pkg) {
      throw new Error(`Package ${input.packageId} not found`);
    }

    // Calculate total
    let totalCents = pkg.priceCents;
    if (input.addOnIds && input.addOnIds.length > 0) {
      const addOns = await this.catalogRepo.getAddOnsByPackageId(pkg.id);
      const selectedAddOns = addOns.filter((a) => input.addOnIds?.includes(a.id));
      totalCents += selectedAddOns.reduce((sum, a) => sum + a.priceCents, 0);
    }

    // Call the same domain path used by webhook handler
    const booking = await this.bookingService.onPaymentCompleted({
      sessionId: input.sessionId,
      packageId: pkg.id,
      eventDate: normalizedDate,
      email: input.email,
      coupleName: input.coupleName,
      addOnIds: input.addOnIds || [],
      totalCents,
    });

    logger.info({ bookingId: booking.id }, '✅ Checkout simulation completed');

    return { bookingId: booking.id };
  }

  /**
   * Get current in-memory state for debugging
   */
  async getDebugState() {
    logger.info('🔍 Fetching debug state');
    return getMockState();
  }
}
