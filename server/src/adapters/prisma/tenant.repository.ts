/**
 * Prisma repository for Tenant data access
 * Provides data layer for multi-tenant operations
 */

import { PrismaClient, Tenant } from '../../generated/prisma';

export interface CreateTenantInput {
  slug: string;
  name: string;
  apiKeyPublic: string;
  apiKeySecret: string;
  commissionPercent: number;
  branding?: any;
}

export interface UpdateTenantInput {
  name?: string;
  commissionPercent?: number;
  branding?: any;
  stripeAccountId?: string;
  stripeOnboarded?: boolean;
  secrets?: any;
  isActive?: boolean;
}

/**
 * Tenant repository for CRUD operations
 * Handles multi-tenant isolation and API key lookups
 */
export class PrismaTenantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find tenant by public API key
   * Used for API authentication and tenant identification
   *
   * @param apiKey - Public API key (pk_live_*)
   * @returns Tenant or null if not found
   */
  async findByApiKey(apiKey: string): Promise<Tenant | null> {
    return await this.prisma.tenant.findUnique({
      where: { apiKeyPublic: apiKey },
    });
  }

  /**
   * Find tenant by ID
   *
   * @param id - Tenant ID (CUID)
   * @returns Tenant or null if not found
   */
  async findById(id: string): Promise<Tenant | null> {
    return await this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  /**
   * Find tenant by slug
   *
   * @param slug - URL-safe tenant identifier
   * @returns Tenant or null if not found
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return await this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  /**
   * Create new tenant
   *
   * @param data - Tenant creation data
   * @returns Created tenant
   */
  async create(data: CreateTenantInput): Promise<Tenant> {
    return await this.prisma.tenant.create({
      data: {
        slug: data.slug,
        name: data.name,
        apiKeyPublic: data.apiKeyPublic,
        apiKeySecret: data.apiKeySecret,
        commissionPercent: data.commissionPercent,
        branding: data.branding || {},
      },
    });
  }

  /**
   * Update tenant by ID
   *
   * @param id - Tenant ID
   * @param data - Partial tenant update data
   * @returns Updated tenant
   */
  async update(id: string, data: UpdateTenantInput): Promise<Tenant> {
    return await this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  /**
   * List all tenants with optional filtering
   *
   * @param onlyActive - Filter to only active tenants
   * @returns Array of tenants
   */
  async list(onlyActive = false): Promise<Tenant[]> {
    return await this.prisma.tenant.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Deactivate tenant (soft delete)
   *
   * @param id - Tenant ID
   * @returns Updated tenant
   */
  async deactivate(id: string): Promise<Tenant> {
    return await this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get tenant statistics (booking count, package count)
   *
   * @param id - Tenant ID
   * @returns Object with counts
   */
  async getStats(id: string): Promise<{
    bookingCount: number;
    packageCount: number;
    addOnCount: number;
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            packages: true,
            addOns: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${id}`);
    }

    return {
      bookingCount: tenant._count.bookings,
      packageCount: tenant._count.packages,
      addOnCount: tenant._count.addOns,
    };
  }
}
