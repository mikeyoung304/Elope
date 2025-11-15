/**
 * Prisma repository for Segment data access
 * Provides data layer for tenant segment operations (e.g., "Wellness Retreat", "Micro-Wedding")
 */

import { PrismaClient, Segment } from '../../generated/prisma';

export interface CreateSegmentInput {
  tenantId: string;
  slug: string;
  name: string;
  heroTitle: string;
  heroSubtitle?: string;
  heroImage?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface UpdateSegmentInput {
  slug?: string;
  name?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  sortOrder?: number;
  active?: boolean;
}

/**
 * Segment repository for CRUD operations
 * Handles tenant-scoped segment management
 */
export class PrismaSegmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find segment by ID
   *
   * @param id - Segment ID (CUID)
   * @returns Segment or null if not found
   */
  async findById(id: string): Promise<Segment | null> {
    return await this.prisma.segment.findUnique({
      where: { id },
    });
  }

  /**
   * Find segment by tenant and slug
   * Used for URL routing (e.g., /wellness-retreat)
   *
   * @param tenantId - Tenant ID for isolation
   * @param slug - URL-safe segment identifier
   * @returns Segment or null if not found
   */
  async findBySlug(tenantId: string, slug: string): Promise<Segment | null> {
    return await this.prisma.segment.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
    });
  }

  /**
   * List all segments for a tenant
   *
   * @param tenantId - Tenant ID for isolation
   * @param onlyActive - Filter to only active segments (default: true)
   * @returns Array of segments ordered by sortOrder
   */
  async findByTenant(tenantId: string, onlyActive = true): Promise<Segment[]> {
    return await this.prisma.segment.findMany({
      where: {
        tenantId,
        ...(onlyActive ? { active: true } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Create new segment
   *
   * @param data - Segment creation data
   * @returns Created segment
   */
  async create(data: CreateSegmentInput): Promise<Segment> {
    return await this.prisma.segment.create({
      data: {
        tenantId: data.tenantId,
        slug: data.slug,
        name: data.name,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroImage: data.heroImage,
        description: data.description,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        sortOrder: data.sortOrder ?? 0,
        active: data.active ?? true,
      },
    });
  }

  /**
   * Update segment by ID
   *
   * @param id - Segment ID
   * @param data - Partial segment update data
   * @returns Updated segment
   */
  async update(id: string, data: UpdateSegmentInput): Promise<Segment> {
    return await this.prisma.segment.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete segment by ID
   * Note: Packages will have segmentId set to null (onDelete: SetNull)
   *
   * @param id - Segment ID
   */
  async delete(id: string): Promise<void> {
    await this.prisma.segment.delete({
      where: { id },
    });
  }

  /**
   * Get segment with related packages
   *
   * @param id - Segment ID
   * @returns Segment with packages or null if not found
   */
  async findByIdWithPackages(id: string): Promise<
    | (Segment & {
        packages: any[];
      })
    | null
  > {
    return await this.prisma.segment.findUnique({
      where: { id },
      include: {
        packages: {
          where: { active: true },
          orderBy: [{ groupingOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  /**
   * Get segment by slug with related packages and add-ons
   * Used for public segment landing pages
   *
   * @param tenantId - Tenant ID for isolation
   * @param slug - URL-safe segment identifier
   * @returns Segment with packages and add-ons or null if not found
   */
  async findBySlugWithRelations(tenantId: string, slug: string): Promise<
    | (Segment & {
        packages: any[];
        addOns: any[];
      })
    | null
  > {
    const segment = await this.prisma.segment.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
      include: {
        packages: {
          where: { active: true },
          orderBy: [{ groupingOrder: 'asc' }, { name: 'asc' }],
          include: {
            addOns: {
              include: {
                addOn: true,
              },
            },
          },
        },
        addOns: {
          where: { active: true },
        },
      },
    });

    if (!segment) {
      return null;
    }

    // Also fetch global add-ons (segmentId = null) and merge them
    const globalAddOns = await this.prisma.addOn.findMany({
      where: {
        tenantId,
        segmentId: null,
        active: true,
      },
    });

    // Merge segment-specific and global add-ons
    return {
      ...segment,
      addOns: [...segment.addOns, ...globalAddOns],
    };
  }

  /**
   * Get segment statistics (package count, booking count)
   *
   * @param id - Segment ID
   * @returns Object with counts
   */
  async getStats(id: string): Promise<{
    packageCount: number;
    addOnCount: number;
  }> {
    const segment = await this.prisma.segment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            packages: true,
            addOns: true,
          },
        },
      },
    });

    if (!segment) {
      throw new Error(`Segment not found: ${id}`);
    }

    return {
      packageCount: segment._count.packages,
      addOnCount: segment._count.addOns,
    };
  }

  /**
   * Check if segment slug is available for tenant
   *
   * @param tenantId - Tenant ID
   * @param slug - Desired slug
   * @param excludeId - Segment ID to exclude (for updates)
   * @returns True if slug is available
   */
  async isSlugAvailable(
    tenantId: string,
    slug: string,
    excludeId?: string
  ): Promise<boolean> {
    const existing = await this.prisma.segment.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
    });

    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
  }
}
