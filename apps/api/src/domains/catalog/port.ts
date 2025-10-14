/**
 * Catalog domain port
 */

import type { Package, AddOn } from './entities';

export interface CatalogRepository {
  getAllPackages(): Promise<Package[]>;
  getPackageBySlug(slug: string): Promise<Package | null>;
  getAddOnsByPackageId(packageId: string): Promise<AddOn[]>;
}
