/**
 * Packages HTTP controller
 */

import type { CatalogService } from '../services/catalog.service';
import type { PackageDto } from '@macon/contracts';
import { mapPackageToDto, mapPackagesToDto } from '../lib/mappers/package.mapper';

export class PackagesController {
  constructor(private readonly catalogService: CatalogService) {}

  async getPackages(tenantId: string): Promise<PackageDto[]> {
    const packages = await this.catalogService.getAllPackages(tenantId);
    return mapPackagesToDto(packages);
  }

  async getPackageBySlug(tenantId: string, slug: string): Promise<PackageDto> {
    const pkg = await this.catalogService.getPackageBySlug(tenantId, slug);
    return mapPackageToDto(pkg);
  }
}
