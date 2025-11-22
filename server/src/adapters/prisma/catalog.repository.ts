/**
 * Prisma Catalog Repository Adapter
 */

import type { PrismaClient } from '../../generated/prisma';
import type {
  CatalogRepository,
  CreatePackageInput,
  UpdatePackageInput,
  CreateAddOnInput,
  UpdateAddOnInput,
  PackagePhoto,
} from '../lib/ports';
import type { Package, AddOn } from '../lib/entities';
import { DomainError } from '../lib/errors';
import type { PrismaJson } from '../types/prisma-json';

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAllPackages(tenantId: string): Promise<Package[]> {
    const packages = await this.prisma.package.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    return packages.map(this.toDomainPackage);
  }

  async getAllPackagesWithAddOns(tenantId: string): Promise<Array<Package & { addOns: AddOn[] }>> {
    const packages = await this.prisma.package.findMany({
      where: { tenantId },
      include: {
        addOns: {
          include: {
            addOn: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return packages.map((pkg) => ({
      ...this.toDomainPackage(pkg),
      addOns: pkg.addOns.map((pa) => this.toDomainAddOn({
        id: pa.addOn.id,
        name: pa.addOn.name,
        price: pa.addOn.price,
        packages: [{ packageId: pkg.id }],
      })),
    }));
  }

  async getPackageBySlug(tenantId: string, slug: string): Promise<Package | null> {
    const pkg = await this.prisma.package.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });

    return pkg ? this.toDomainPackage(pkg) : null;
  }

  async getPackageById(tenantId: string, id: string): Promise<Package | null> {
    const pkg = await this.prisma.package.findFirst({
      where: { tenantId, id },
    });

    return pkg ? this.toDomainPackage(pkg) : null;
  }

  async getAddOnsByPackageId(tenantId: string, packageId: string): Promise<AddOn[]> {
    const addOns = await this.prisma.addOn.findMany({
      where: {
        tenantId,
        packages: {
          some: {
            packageId: packageId,
          },
        },
      },
      include: {
        packages: {
          select: {
            packageId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return addOns.map(this.toDomainAddOn);
  }

  async createPackage(tenantId: string, data: CreatePackageInput): Promise<Package> {
    // Check for slug uniqueness within tenant - use select to minimize data transfer
    const existing = await this.prisma.package.findUnique({
      where: { tenantId_slug: { tenantId, slug: data.slug } },
      select: { id: true },
    });

    if (existing) {
      throw new DomainError('DUPLICATE_SLUG', `Package with slug '${data.slug}' already exists`);
    }

    const pkg = await this.prisma.package.create({
      data: {
        tenantId,
        slug: data.slug,
        name: data.title,
        description: data.description,
        basePrice: data.priceCents,
      },
    });

    return this.toDomainPackage(pkg);
  }

  async updatePackage(tenantId: string, id: string, data: UpdatePackageInput): Promise<Package> {
    // Check if package exists for this tenant AND validate slug uniqueness in a single query
    // This reduces database roundtrips from 3 queries to 1 query + 1 update
    const existing = await this.prisma.package.findFirst({
      where: { tenantId, id },
      select: { id: true, slug: true },
    });

    if (!existing) {
      throw new DomainError('NOT_FOUND', `Package with id '${id}' not found`);
    }

    // If updating slug, check for uniqueness within tenant
    if (data.slug && data.slug !== existing.slug) {
      const duplicateSlug = await this.prisma.package.findUnique({
        where: { tenantId_slug: { tenantId, slug: data.slug } },
        select: { id: true },
      });

      if (duplicateSlug) {
        throw new DomainError('DUPLICATE_SLUG', `Package with slug '${data.slug}' already exists`);
      }
    }

    const pkg = await this.prisma.package.update({
      where: { id, tenantId },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.title !== undefined && { name: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priceCents !== undefined && { basePrice: data.priceCents }),
        ...(data.photos !== undefined && { photos: data.photos }),
      },
    });

    return this.toDomainPackage(pkg);
  }

  async deletePackage(tenantId: string, id: string): Promise<void> {
    // Check if package exists for this tenant - optimize with select
    const existing = await this.prisma.package.findFirst({
      where: { tenantId, id },
      select: { id: true },
    });

    if (!existing) {
      throw new DomainError('NOT_FOUND', `Package with id '${id}' not found`);
    }

    // Prisma will cascade delete add-ons automatically
    await this.prisma.package.delete({
      where: { id, tenantId },
    });
  }

  async createAddOn(tenantId: string, data: CreateAddOnInput): Promise<AddOn> {
    // Verify package exists for this tenant - optimize with select
    const pkg = await this.prisma.package.findFirst({
      where: { tenantId, id: data.packageId },
      select: { id: true },
    });

    if (!pkg) {
      throw new DomainError('NOT_FOUND', `Package with id '${data.packageId}' not found`);
    }

    const addOn = await this.prisma.addOn.create({
      data: {
        tenantId,
        slug: `${data.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: data.title,
        price: data.priceCents,
        packages: {
          create: {
            packageId: data.packageId,
          },
        },
      },
      include: {
        packages: {
          select: {
            packageId: true,
          },
        },
      },
    });

    return this.toDomainAddOn(addOn);
  }

  async updateAddOn(tenantId: string, id: string, data: UpdateAddOnInput): Promise<AddOn> {
    // Check if add-on exists for this tenant - optimize with select
    const existing = await this.prisma.addOn.findFirst({
      where: { tenantId, id },
      select: {
        id: true,
        packages: {
          select: {
            packageId: true,
          },
        },
      },
    });

    if (!existing) {
      throw new DomainError('NOT_FOUND', `AddOn with id '${id}' not found`);
    }

    // If updating packageId, verify new package exists for this tenant - optimize with select
    if (data.packageId && data.packageId !== existing.packages[0]?.packageId) {
      const pkg = await this.prisma.package.findFirst({
        where: { tenantId, id: data.packageId },
        select: { id: true },
      });

      if (!pkg) {
        throw new DomainError('NOT_FOUND', `Package with id '${data.packageId}' not found`);
      }
    }

    const addOn = await this.prisma.addOn.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { name: data.title }),
        ...(data.priceCents !== undefined && { price: data.priceCents }),
        ...(data.packageId !== undefined && {
          packages: {
            deleteMany: {},
            create: {
              packageId: data.packageId,
            },
          },
        }),
      },
      include: {
        packages: {
          select: {
            packageId: true,
          },
        },
      },
    });

    return this.toDomainAddOn(addOn);
  }

  async deleteAddOn(tenantId: string, id: string): Promise<void> {
    // Check if add-on exists for this tenant - optimize with select
    const existing = await this.prisma.addOn.findFirst({
      where: { tenantId, id },
      select: { id: true },
    });

    if (!existing) {
      throw new DomainError('NOT_FOUND', `AddOn with id '${id}' not found`);
    }

    await this.prisma.addOn.delete({
      where: { id },
    });
  }

  /**
   * Get packages for a specific segment
   *
   * MULTI-TENANT: Scoped by tenantId and segmentId
   * Used for segment landing pages
   *
   * @param tenantId - Tenant ID for isolation
   * @param segmentId - Segment ID to filter packages
   * @returns Array of packages ordered by groupingOrder then createdAt
   */
  async getPackagesBySegment(tenantId: string, segmentId: string): Promise<Package[]> {
    const packages = await this.prisma.package.findMany({
      where: {
        tenantId,
        segmentId,
        active: true,
      },
      orderBy: [
        { groupingOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return packages.map(this.toDomainPackage);
  }

  /**
   * Get packages with add-ons for a specific segment
   *
   * MULTI-TENANT: Scoped by tenantId and segmentId
   * Returns packages with both segment-specific and global add-ons
   * Used for segment landing pages
   *
   * @param tenantId - Tenant ID for isolation
   * @param segmentId - Segment ID to filter packages
   * @returns Array of packages with add-ons, ordered by grouping
   */
  async getPackagesBySegmentWithAddOns(
    tenantId: string,
    segmentId: string
  ): Promise<Array<Package & { addOns: AddOn[] }>> {
    const packages = await this.prisma.package.findMany({
      where: {
        tenantId,
        segmentId,
        active: true,
      },
      include: {
        addOns: {
          include: {
            addOn: true,
          },
        },
      },
      orderBy: [
        { groupingOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Filter add-ons to include only those that are segment-specific or global
    return packages.map((pkg) => ({
      ...this.toDomainPackage(pkg),
      addOns: pkg.addOns
        .filter((pa: any) => {
          // Include add-ons that are either segment-specific OR global (null segmentId)
          const addOn = pa.addOn;
          return (
            addOn.active &&
            (addOn.segmentId === segmentId || addOn.segmentId === null)
          );
        })
        .map((pa: any) => this.toDomainAddOn({
          id: pa.addOn.id,
          name: pa.addOn.name,
          price: pa.addOn.price,
          packages: [{ packageId: pkg.id }],
        })),
    }));
  }

  /**
   * Get add-ons available for a segment
   *
   * Returns both:
   * - Add-ons scoped to this specific segment (segmentId = specified)
   * - Global add-ons available to all segments (segmentId = null)
   *
   * Used for segment landing pages and package detail pages
   *
   * @param tenantId - Tenant ID for isolation
   * @param segmentId - Segment ID to filter add-ons
   * @returns Array of add-ons ordered by createdAt
   */
  async getAddOnsForSegment(tenantId: string, segmentId: string): Promise<AddOn[]> {
    const addOns = await this.prisma.addOn.findMany({
      where: {
        tenantId,
        // Include add-ons that are either segment-specific OR global
        OR: [
          { segmentId },
          { segmentId: null },
        ],
        active: true,
      },
      include: {
        packages: {
          select: {
            packageId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return addOns.map(this.toDomainAddOn);
  }

  // Mappers
  private toDomainPackage(pkg: {
    id: string;
    tenantId: string;
    slug: string;
    name: string;
    description: string | null;
    basePrice: number;
    active: boolean;
    segmentId?: string | null;
    grouping?: string | null;
    groupingOrder?: number | null;
    photos?: PrismaJson<PackagePhoto[]>;
  }): Package {
    return {
      id: pkg.id,
      tenantId: pkg.tenantId,
      slug: pkg.slug,
      title: pkg.name,
      description: pkg.description || '',
      priceCents: pkg.basePrice,
      photoUrl: undefined,
      photos: (pkg.photos as PackagePhoto[]) || [],
      active: pkg.active,
      segmentId: pkg.segmentId,
      grouping: pkg.grouping,
      groupingOrder: pkg.groupingOrder,
    };
  }

  private toDomainAddOn(addOn: {
    id: string;
    name: string;
    price: number;
    packages: { packageId: string }[];
  }): AddOn {
    return {
      id: addOn.id,
      packageId: addOn.packages[0]?.packageId || '',
      title: addOn.name,
      priceCents: addOn.price,
      photoUrl: undefined,
    };
  }
}
