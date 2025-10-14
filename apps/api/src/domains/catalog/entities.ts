/**
 * Catalog domain entities
 */

export interface Package {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceCents: number;
  photoUrl?: string;
}

export interface AddOn {
  id: string;
  packageId: string;
  title: string;
  priceCents: number;
  photoUrl?: string;
}
