/**
 * Platform Admin Controller
 * Handles platform-level operations (tenant management, system monitoring, etc.)
 */

import type { PrismaClient } from '../generated/prisma/index.js';
import type { TenantDto } from '@elope/contracts';
import { logger } from '../lib/core/logger';

export class PlatformAdminController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all tenants with their stats
   */
  async getAllTenants(): Promise<TenantDto[]> {
    try {
      const tenants = await this.prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              packages: true,
              bookings: true,
            },
          },
        },
      });

      return tenants.map((tenant) => ({
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        email: tenant.email,
        commissionPercent: Number(tenant.commissionPercent),
        stripeAccountId: tenant.stripeAccountId,
        stripeOnboarded: tenant.stripeOnboarded,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
        packageCount: tenant._count.packages,
        bookingCount: tenant._count.bookings,
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch tenants');
      throw error;
    }
  }
}
