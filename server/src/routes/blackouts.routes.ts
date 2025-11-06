/**
 * Blackouts HTTP controller
 */

import type { BlackoutRepository } from '../lib/ports';

// Default tenant for admin operations (legacy single-tenant mode)
const DEFAULT_TENANT = 'tenant_default_legacy';

export class BlackoutsController {
  constructor(private readonly blackoutRepo: BlackoutRepository) {}

  async getBlackouts(): Promise<Array<{ date: string; reason?: string }>> {
    return this.blackoutRepo.getAllBlackouts(DEFAULT_TENANT);
  }

  async createBlackout(input: { date: string; reason?: string }): Promise<{ ok: true }> {
    await this.blackoutRepo.addBlackout(DEFAULT_TENANT, input.date, input.reason);
    return { ok: true };
  }
}
