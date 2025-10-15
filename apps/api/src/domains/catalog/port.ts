/**
 * Catalog domain port
 */

import type { Package, AddOn } from './entities';

// Input types for CRUD operations
export interface CreatePackageInput {
  slug: string;
  title: string;
  description: string;
  priceCents: number;
  photoUrl?: string;
}

export interface UpdatePackageInput {
  slug?: string;
  title?: string;
  description?: string;
  priceCents?: number;
  photoUrl?: string;
}

export interface CreateAddOnInput {
  packageId: string;
  title: string;
  priceCents: number;
  photoUrl?: string;
}

export interface UpdateAddOnInput {
  packageId?: string;
  title?: string;
  priceCents?: number;
  photoUrl?: string;
}

export interface CatalogRepository {
  getAllPackages(): Promise<Package[]>;
  getPackageBySlug(slug: string): Promise<Package | null>;
  getAddOnsByPackageId(packageId: string): Promise<AddOn[]>;
  getPackageById(id: string): Promise<Package | null>;

  // Package CRUD
  createPackage(data: CreatePackageInput): Promise<Package>;
  updatePackage(id: string, data: UpdatePackageInput): Promise<Package>;
  deletePackage(id: string): Promise<void>;

  // AddOn CRUD
  createAddOn(data: CreateAddOnInput): Promise<AddOn>;
  updateAddOn(id: string, data: UpdateAddOnInput): Promise<AddOn>;
  deleteAddOn(id: string): Promise<void>;
}
