/**
 * Platform Admin Controller
 * Handles platform-level operations (tenant management, system monitoring, etc.)
 */

import type { PrismaClient } from '../generated/prisma/index.js';
import type { TenantDto, PlatformStats } from '@macon/contracts';
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

  /**
   * Get platform-wide statistics
   * Aggregates data across all tenants
   */
  async getStats(): Promise<PlatformStats> {
    try {
      // Aggregate tenant counts
      const totalTenants = await this.prisma.tenant.count();
      const activeTenants = await this.prisma.tenant.count({
        where: { isActive: true },
      });

      // Aggregate segment counts
      const totalSegments = await this.prisma.segment.count();
      const activeSegments = await this.prisma.segment.count({
        where: { active: true },
      });

      // Aggregate booking metrics
      const totalBookings = await this.prisma.booking.count();
      const confirmedBookings = await this.prisma.booking.count({
        where: { status: 'CONFIRMED' },
      });
      const pendingBookings = await this.prisma.booking.count({
        where: { status: 'PENDING' },
      });

      // Aggregate revenue metrics
      const revenueStats = await this.prisma.booking.aggregate({
        _sum: {
          totalPrice: true,
          commissionAmount: true,
        },
        where: {
          status: 'CONFIRMED',
        },
      });

      const totalRevenue = revenueStats._sum.totalPrice || 0;
      const platformCommission = revenueStats._sum.commissionAmount || 0;
      const tenantRevenue = totalRevenue - platformCommission;

      // Optional: Current month stats
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const monthStats = await this.prisma.booking.aggregate({
        _count: true,
        _sum: {
          totalPrice: true,
        },
        where: {
          status: 'CONFIRMED',
          confirmedAt: {
            gte: startOfMonth,
          },
        },
      });

      return {
        // Tenant metrics
        totalTenants,
        activeTenants,

        // Segment metrics
        totalSegments,
        activeSegments,

        // Booking metrics
        totalBookings,
        confirmedBookings,
        pendingBookings,

        // Revenue metrics (in cents)
        totalRevenue,
        platformCommission,
        tenantRevenue,

        // Time-based metrics (optional)
        revenueThisMonth: monthStats._sum.totalPrice || 0,
        bookingsThisMonth: monthStats._count || 0,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch platform stats');
      throw error;
    }
  }
}
