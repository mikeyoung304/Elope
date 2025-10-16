/**
 * Admin Package CRUD HTTP controller
 */

import type { CatalogService } from '../../domains/catalog/service';
import type {
  CreatePackageDto,
  UpdatePackageDto,
  PackageResponseDto,
  CreateAddOnDto,
  UpdateAddOnDto,
  AddOnDto,
} from '@elope/contracts';

export class AdminPackagesController {
  constructor(private readonly catalogService: CatalogService) {}

  async createPackage(data: CreatePackageDto): Promise<PackageResponseDto> {
    const pkg = await this.catalogService.createPackage(data);
    return {
      id: pkg.id,
      slug: pkg.slug,
      title: pkg.title,
      description: pkg.description,
      priceCents: pkg.priceCents,
      photoUrl: pkg.photoUrl,
    };
  }

  async updatePackage(id: string, data: UpdatePackageDto): Promise<PackageResponseDto> {
    const pkg = await this.catalogService.updatePackage(id, data);
    return {
      id: pkg.id,
      slug: pkg.slug,
      title: pkg.title,
      description: pkg.description,
      priceCents: pkg.priceCents,
      photoUrl: pkg.photoUrl,
    };
  }

  async deletePackage(id: string): Promise<void> {
    await this.catalogService.deletePackage(id);
  }

  async createAddOn(packageId: string, data: CreateAddOnDto): Promise<AddOnDto> {
    const addOn = await this.catalogService.createAddOn({
      ...data,
      packageId,
    });
    return {
      id: addOn.id,
      packageId: addOn.packageId,
      title: addOn.title,
      priceCents: addOn.priceCents,
      photoUrl: addOn.photoUrl,
    };
  }

  async updateAddOn(id: string, data: UpdateAddOnDto): Promise<AddOnDto> {
    const addOn = await this.catalogService.updateAddOn(id, data);
    return {
      id: addOn.id,
      packageId: addOn.packageId,
      title: addOn.title,
      priceCents: addOn.priceCents,
      photoUrl: addOn.photoUrl,
    };
  }

  async deleteAddOn(id: string): Promise<void> {
    await this.catalogService.deleteAddOn(id);
  }
}
