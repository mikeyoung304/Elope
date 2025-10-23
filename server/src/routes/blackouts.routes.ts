/**
 * Blackouts HTTP controller
 */

import type { BlackoutRepository } from '../lib/ports';

export class BlackoutsController {
  constructor(private readonly blackoutRepo: BlackoutRepository) {}

  async getBlackouts(): Promise<Array<{ date: string; reason?: string }>> {
    return this.blackoutRepo.getAllBlackouts();
  }

  async createBlackout(input: { date: string; reason?: string }): Promise<{ ok: true }> {
    await this.blackoutRepo.addBlackout(input.date, input.reason);
    return { ok: true };
  }
}
