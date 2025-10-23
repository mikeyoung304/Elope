/**
 * Domain entities
 */

// ============================================================================
// Catalog Entities
// ============================================================================

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
