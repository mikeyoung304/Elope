/**
 * Catalog domain service
 */

import type { CatalogRepository } from './port';
import type { Package, AddOn } from './entities';
import { NotFoundError } from '../../core/errors';

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
}
