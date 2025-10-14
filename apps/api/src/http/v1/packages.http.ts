/**
 * Packages HTTP controller
 */

import type { CatalogService } from '../../domains/catalog/service';
import type { PackageDto, AddOnDto } from '@elope/contracts';

export class PackagesController {
  constructor(private readonly catalogService: CatalogService) {}

  async getPackages(): Promise<PackageDto[]> {
    const packages = await this.catalogService.getAllPackages();
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

  async getPackageBySlug(slug: string): Promise<PackageDto> {
    const pkg = await this.catalogService.getPackageBySlug(slug);
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
