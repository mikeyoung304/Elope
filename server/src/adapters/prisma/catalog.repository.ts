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
} from '../lib/ports';
import type { Package, AddOn } from '../lib/entities';
import { DomainError } from '../lib/core/errors';

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
    // Check for slug uniqueness within tenant
    const existing = await this.prisma.package.findUnique({
      where: { tenantId_slug: { tenantId, slug: data.slug } },
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
    // Check if package exists for this tenant
    const existing = await this.prisma.package.findFirst({
      where: { tenantId, id },
    });

    if (!existing) {
      throw new DomainError('NOT_FOUND', `Package with id '${id}' not found`);
    }

    // If updating slug, check for uniqueness within tenant
    if (data.slug && data.slug !== existing.slug) {
      const duplicateSlug = await this.prisma.package.findUnique({
        where: { tenantId_slug: { tenantId, slug: data.slug } },
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
    // Check if package exists for this tenant
    const existing = await this.prisma.package.findFirst({
      where: { tenantId, id },
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
    // Verify package exists for this tenant
    const pkg = await this.prisma.package.findFirst({
      where: { tenantId, id: data.packageId },
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
    // Check if add-on exists for this tenant
    const existing = await this.prisma.addOn.findFirst({
      where: { tenantId, id },
      include: {
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

    // If updating packageId, verify new package exists for this tenant
    if (data.packageId && data.packageId !== existing.packages[0]?.packageId) {
      const pkg = await this.prisma.package.findFirst({
        where: { tenantId, id: data.packageId },
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
    // Check if add-on exists for this tenant
    const existing = await this.prisma.addOn.findFirst({
      where: { tenantId, id },
    });

    if (!existing) {
      throw new DomainError('NOT_FOUND', `AddOn with id '${id}' not found`);
    }

    await this.prisma.addOn.delete({
      where: { id },
    });
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
    photos?: any;
  }): Package {
    return {
      id: pkg.id,
      tenantId: pkg.tenantId,
      slug: pkg.slug,
      title: pkg.name,
      description: pkg.description || '',
      priceCents: pkg.basePrice,
      photoUrl: undefined,
      photos: pkg.photos || [],
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
