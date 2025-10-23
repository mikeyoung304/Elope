/**
 * Catalog domain service
 */

import type {
  CatalogRepository,
  CreatePackageInput,
  UpdatePackageInput,
  CreateAddOnInput,
  UpdateAddOnInput,
} from '../lib/ports';
import type { Package, AddOn } from '../lib/entities';
import { NotFoundError, ValidationError } from '../lib/core/errors';

export interface PackageWithAddOns extends Package {
  addOns: AddOn[];
}

export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  async getAllPackages(): Promise<PackageWithAddOns[]> {
    const packages = await this.repository.getAllPackages();
    const packagesWithAddOns = await Promise.all(
      packages.map(async (pkg) => {
        const addOns = await this.repository.getAddOnsByPackageId(pkg.id);
        return { ...pkg, addOns };
      })
    );
    return packagesWithAddOns;
  }

  async getPackageBySlug(slug: string): Promise<PackageWithAddOns> {
    const pkg = await this.repository.getPackageBySlug(slug);
    if (!pkg) {
      throw new NotFoundError(`Package with slug "${slug}" not found`);
    }
    const addOns = await this.repository.getAddOnsByPackageId(pkg.id);
    return { ...pkg, addOns };
  }

  // Package CRUD operations

  async createPackage(data: CreatePackageInput): Promise<Package> {
    // Validate required fields
    if (!data.slug || !data.title || !data.description) {
      throw new ValidationError('slug, title, and description are required');
    }

    if (data.priceCents < 0) {
      throw new ValidationError('priceCents must be non-negative');
    }

    // Check slug uniqueness
    const existing = await this.repository.getPackageBySlug(data.slug);
    if (existing) {
      throw new ValidationError(`Package with slug "${data.slug}" already exists`);
    }

    return this.repository.createPackage(data);
  }

  async updatePackage(id: string, data: UpdatePackageInput): Promise<Package> {
    // Check if package exists
    const existing = await this.repository.getPackageById(id);
    if (!existing) {
      throw new NotFoundError(`Package with id "${id}" not found`);
    }

    // Validate price if provided
    if (data.priceCents !== undefined && data.priceCents < 0) {
      throw new ValidationError('priceCents must be non-negative');
    }

    // Check slug uniqueness if slug is being updated
    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await this.repository.getPackageBySlug(data.slug);
      if (slugTaken) {
        throw new ValidationError(`Package with slug "${data.slug}" already exists`);
      }
    }

    return this.repository.updatePackage(id, data);
  }

  async deletePackage(id: string): Promise<void> {
    // Check if package exists
    const existing = await this.repository.getPackageById(id);
    if (!existing) {
      throw new NotFoundError(`Package with id "${id}" not found`);
    }

    return this.repository.deletePackage(id);
  }

  // AddOn CRUD operations

  async createAddOn(data: CreateAddOnInput): Promise<AddOn> {
    // Validate required fields
    if (!data.packageId || !data.title) {
      throw new ValidationError('packageId and title are required');
    }

    if (data.priceCents < 0) {
      throw new ValidationError('priceCents must be non-negative');
    }

    // Verify package exists
    const pkg = await this.repository.getPackageById(data.packageId);
    if (!pkg) {
      throw new NotFoundError(`Package with id "${data.packageId}" not found`);
    }

    return this.repository.createAddOn(data);
  }

  async updateAddOn(id: string, data: UpdateAddOnInput): Promise<AddOn> {
    // Check if add-on exists
    // Note: We need a way to get add-on by ID, but since the port doesn't have it,
    // we'll let the repository handle the NotFound case

    // Validate price if provided
    if (data.priceCents !== undefined && data.priceCents < 0) {
      throw new ValidationError('priceCents must be non-negative');
    }

    // Verify package exists if packageId is being updated
    if (data.packageId) {
      const pkg = await this.repository.getPackageById(data.packageId);
      if (!pkg) {
        throw new NotFoundError(`Package with id "${data.packageId}" not found`);
      }
    }

    return this.repository.updateAddOn(id, data);
  }

  async deleteAddOn(id: string): Promise<void> {
    // Repository will throw NotFoundError if add-on doesn't exist
    return this.repository.deleteAddOn(id);
  }
}
