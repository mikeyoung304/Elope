/**
 * Prisma Blackout Repository Adapter
 */

import type { PrismaClient } from '../../generated/prisma';
import type { BlackoutRepository } from '../lib/ports';
import { toISODate } from '../lib/date-utils';

export class PrismaBlackoutRepository implements BlackoutRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async isBlackoutDate(tenantId: string, date: string): Promise<boolean> {
    const blackout = await this.prisma.blackoutDate.findUnique({
      where: { tenantId_date: { tenantId, date: new Date(date) } },
    });

    return blackout !== null;
  }

  async getAllBlackouts(tenantId: string): Promise<Array<{ date: string; reason?: string }>> {
    const blackouts = await this.prisma.blackoutDate.findMany({
      where: { tenantId },
      orderBy: { date: 'asc' },
    });

    return blackouts.map((b) => ({
      date: toISODate(b.date),
      ...(b.reason && { reason: b.reason }),
    }));
  }

  async addBlackout(tenantId: string, date: string, reason?: string): Promise<void> {
    await this.prisma.blackoutDate.create({
      data: {
        tenantId,
        date: new Date(date),
        ...(reason && { reason }),
      },
    });
  }
}
