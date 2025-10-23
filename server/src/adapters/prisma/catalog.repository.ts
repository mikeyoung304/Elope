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

  async getAllPackages(): Promise<Package[]> {
    const packages = await this.prisma.package.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return packages.map(this.toDomainPackage);
  }

  async getPackageBySlug(slug: string): Promise<Package | null> {
    const pkg = await this.prisma.package.findUnique({
      where: { slug },
    });

    return pkg ? this.toDomainPackage(pkg) : null;
  }

  async getPackageById(id: string): Promise<Package | null> {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
    });

    return pkg ? this.toDomainPackage(pkg) : null;
  }

  async getAddOnsByPackageId(packageId: string): Promise<AddOn[]> {
    const addOns = await this.prisma.addOn.findMany({
      where: {
        packages: {
          some: {
            packageId: packageId,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return addOns.map(this.toDomainAddOn);
  }

  async createPackage(data: CreatePackageInput): Promise<Package> {
    // Check for slug uniqueness
    const existing = await this.prisma.package.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new DomainError('DUPLICATE_SLUG', `Package with slug '${data.slug}' already exists`);
    }

    const pkg = await this.prisma.package.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        priceCents: data.priceCents,
        photoUrl: data.photoUrl,
      },
    });

    return this.toDomainPackage(pkg);
  }

  async updatePackage(id: string, data: UpdatePackageInput): Promise<Package> {
    // Check if package exists
    const existing = await this.prisma.package.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new DomainError('NOT_FOUND', `Package with id '${id}' not found`);
    }

    // If updating slug, check for uniqueness
    if (data.slug && data.slug !== existing.slug) {
      const duplicateSlug = await this.prisma.package.findUnique({
        where: { slug: data.slug },
      });

      if (duplicateSlug) {
        throw new DomainError('DUPLICATE_SLUG', `Package with slug '${data.slug}' already exists`);
      }
    }

    const pkg = await this.prisma.package.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      },
    });

    return this.toDomainPackage(pkg);
  }

  async deletePackage(id: string): Promise<void> {
    // Check if package exists
    const existing = await this.prisma.package.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new DomainError('NOT_FOUND', `Package with id '${id}' not found`);
    }

    // Prisma will cascade delete add-ons automatically
    await this.prisma.package.delete({
      where: { id },
    });
  }

  async createAddOn(data: CreateAddOnInput): Promise<AddOn> {
    // Verify package exists
    const pkg = await this.prisma.package.findUnique({
      where: { id: data.packageId },
    });

    if (!pkg) {
      throw new DomainError('NOT_FOUND', `Package with id '${data.packageId}' not found`);
    }

    const addOn = await this.prisma.addOn.create({
      data: {
        packageId: data.packageId,
        title: data.title,
        priceCents: data.priceCents,
        photoUrl: data.photoUrl,
      },
    });

    return this.toDomainAddOn(addOn);
  }

  async updateAddOn(id: string, data: UpdateAddOnInput): Promise<AddOn> {
    // Check if add-on exists
    const existing = await this.prisma.addOn.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new DomainError('NOT_FOUND', `AddOn with id '${id}' not found`);
    }

    // If updating packageId, verify new package exists
    if (data.packageId && data.packageId !== existing.packageId) {
      const pkg = await this.prisma.package.findUnique({
        where: { id: data.packageId },
      });

      if (!pkg) {
        throw new DomainError('NOT_FOUND', `Package with id '${data.packageId}' not found`);
      }
    }

    const addOn = await this.prisma.addOn.update({
      where: { id },
      data: {
        ...(data.packageId !== undefined && { packageId: data.packageId }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      },
    });

    return this.toDomainAddOn(addOn);
  }

  async deleteAddOn(id: string): Promise<void> {
    // Check if add-on exists
    const existing = await this.prisma.addOn.findUnique({
      where: { id },
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
    slug: string;
    title: string;
    description: string;
    priceCents: number;
    photoUrl: string | null;
  }): Package {
    return {
      id: pkg.id,
      slug: pkg.slug,
      title: pkg.title,
      description: pkg.description,
      priceCents: pkg.priceCents,
      ...(pkg.photoUrl && { photoUrl: pkg.photoUrl }),
    };
  }

  private toDomainAddOn(addOn: {
    id: string;
    packageId: string;
    title: string;
    priceCents: number;
    photoUrl: string | null;
  }): AddOn {
    return {
      id: addOn.id,
      packageId: addOn.packageId,
      title: addOn.title,
      priceCents: addOn.priceCents,
      ...(addOn.photoUrl && { photoUrl: addOn.photoUrl }),
    };
  }
}
