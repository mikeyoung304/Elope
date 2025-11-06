/**
 * Prisma Blackout Repository Adapter
 */

import type { PrismaClient } from '../../generated/prisma';
import type { BlackoutRepository } from '../lib/ports';
import { toISODate } from '../lib/date-utils';

export class PrismaBlackoutRepository implements BlackoutRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async isBlackoutDate(date: string): Promise<boolean> {
    const blackout = await this.prisma.blackoutDate.findUnique({
      where: { date: new Date(date) },
    });

    return blackout !== null;
  }

  async getAllBlackouts(): Promise<Array<{ date: string; reason?: string }>> {
    const blackouts = await this.prisma.blackoutDate.findMany({
      orderBy: { date: 'asc' },
    });

    return blackouts.map((b) => ({
      date: toISODate(b.date),
      ...(b.reason && { reason: b.reason }),
    }));
  }

  async addBlackout(date: string, reason?: string): Promise<void> {
    await this.prisma.blackoutDate.create({
      data: {
        date: new Date(date),
        ...(reason && { reason }),
      },
    });
  }
}
