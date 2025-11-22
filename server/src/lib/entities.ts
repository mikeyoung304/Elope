/**
 * Domain entities
 */

// ============================================================================
// Catalog Entities
// ============================================================================

export interface PackagePhoto {
  url: string;
  filename: string;
  size: number;
  order: number;
}

export interface Package {
  id: string;
  tenantId: string; // Multi-tenant isolation
  slug: string;
  title: string;
  description: string;
  priceCents: number;
  photoUrl?: string;
  photos?: PackagePhoto[]; // Photo gallery
  // Segment and grouping fields
  segmentId?: string | null;
  grouping?: string | null;
  groupingOrder?: number | null;
  active?: boolean; // Package active status (maps to DB 'active' field)
}

export interface AddOn {
  id: string;
  packageId: string;
  title: string;
  priceCents: number;
  photoUrl?: string;
}

// ============================================================================
// Booking Entities
// ============================================================================

export interface Booking {
  id: string;
  packageId: string;
  coupleName: string;
  email: string;
  phone?: string;
  eventDate: string; // YYYY-MM-DD format
  addOnIds: string[];
  totalCents: number;
  commissionAmount?: number; // Platform commission in cents
  commissionPercent?: number; // Commission percentage (e.g., 12.5)
  status: 'PAID' | 'REFUNDED' | 'CANCELED';
  createdAt: string; // ISO 8601 format
}

/**
 * Input for creating a booking (before payment)
 */
export interface CreateBookingInput {
  packageId: string;
  eventDate: string;
  email: string;
  coupleName: string;
  addOnIds?: string[];
}

// ============================================================================
// Blackout Entities
// ============================================================================

export interface Blackout {
  date: string; // YYYY-MM-DD format
  reason?: string;
}
