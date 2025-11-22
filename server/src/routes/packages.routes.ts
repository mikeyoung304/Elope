/**
 * Packages HTTP controller
 */

import type { CatalogService } from '../services/catalog.service';
import type { PackageDto, AddOnDto } from '@macon/contracts';

export class PackagesController {
  constructor(private readonly catalogService: CatalogService) {}

  async getPackages(tenantId: string): Promise<PackageDto[]> {
    const packages = await this.catalogService.getAllPackages(tenantId);
    return packages.map((pkg) => ({
      id: pkg.id,
      slug: pkg.slug,
      title: pkg.title,
      description: pkg.description,
      priceCents: pkg.priceCents,
      photoUrl: pkg.photoUrl,
      addOns: pkg.addOns.map((addOn): AddOnDto => ({
        id: addOn.id,
        packageId: addOn.packageId,
        title: addOn.title,
        priceCents: addOn.priceCents,
        photoUrl: addOn.photoUrl,
      })),
    }));
  }

  async getPackageBySlug(tenantId: string, slug: string): Promise<PackageDto> {
    const pkg = await this.catalogService.getPackageBySlug(tenantId, slug);
    return {
      id: pkg.id,
      slug: pkg.slug,
      title: pkg.title,
      description: pkg.description,
      priceCents: pkg.priceCents,
      photoUrl: pkg.photoUrl,
      addOns: pkg.addOns.map((addOn): AddOnDto => ({
        id: addOn.id,
        packageId: addOn.packageId,
        title: addOn.title,
        priceCents: addOn.priceCents,
        photoUrl: addOn.photoUrl,
      })),
    };
  }
}
