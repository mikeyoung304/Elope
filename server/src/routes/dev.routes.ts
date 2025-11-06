/**
 * Dev-only controller for mock mode simulators
 */

import { toUtcMidnight } from '@elope/shared';
import type { BookingService } from '../services/booking.service';
import type { CatalogRepository } from '../lib/ports';
import { getMockState, resetMockState } from '../adapters/mock';
import { logger } from '../lib/core/logger';

// Default tenant for dev simulator (mock mode)
const DEFAULT_TENANT = 'tenant_default_legacy';

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
    const pkg = await this.catalogRepo.getPackageById(DEFAULT_TENANT, input.packageId);
    if (!pkg) {
      throw new Error(`Package ${input.packageId} not found`);
    }

    // Calculate total
    let totalCents = pkg.priceCents;
    if (input.addOnIds && input.addOnIds.length > 0) {
      const addOns = await this.catalogRepo.getAddOnsByPackageId(DEFAULT_TENANT, pkg.id);
      const selectedAddOns = addOns.filter((a) => input.addOnIds?.includes(a.id));
      totalCents += selectedAddOns.reduce((sum, a) => sum + a.priceCents, 0);
    }

    // Call the same domain path used by webhook handler
    const booking = await this.bookingService.onPaymentCompleted(DEFAULT_TENANT, {
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

  /**
   * Reset in-memory state to initial seed (E2E test determinism)
   */
  async reset(): Promise<void> {
    logger.info('🔄 Resetting mock state');
    resetMockState();
  }
}
