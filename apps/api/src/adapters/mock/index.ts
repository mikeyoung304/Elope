/**
 * Mock adapters for local development without external services
 */

import { toUtcMidnight } from '@elope/shared';
import type { Package, AddOn } from '../../domains/catalog/entities';
import type { CatalogRepository } from '../../domains/catalog/port';
import type { Booking } from '../../domains/booking/entities';
import type { BookingRepository } from '../../domains/booking/port';
import type {
  BlackoutRepository,
  CalendarProvider,
} from '../../domains/availability/port';
import type { PaymentProvider, CheckoutSession } from '../../domains/payments/port';
import type { EmailProvider } from '../../domains/notifications/port';
import type { User, UserRepository } from '../../domains/identity/port';
import { BookingConflictError } from '../../domains/booking/errors';
import bcrypt from 'bcryptjs';

// In-memory storage
const packages = new Map<string, Package>();
const addOns = new Map<string, AddOn>();
const bookings = new Map<string, Booking>(); // keyed by booking ID
const bookingsByDate = new Map<string, string>(); // date -> booking ID
const blackouts = new Map<string, { date: string; reason?: string }>();
const calendarBusyDates = new Set<string>();
const users = new Map<string, User>();

// Seed data on module load
function seedData(): void {
  if (packages.size > 0) return; // Already seeded

  // Packages
  packages.set('pkg_basic', {
    id: 'pkg_basic',
    slug: 'basic-elopement',
    title: 'Basic Elopement',
    description: 'Simple, intimate ceremony with professional photography and officiant',
    priceCents: 99900, // $999
    photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
  });

  packages.set('pkg_micro', {
    id: 'pkg_micro',
    slug: 'micro-ceremony',
    title: 'Micro Ceremony',
    description: 'Intimate micro-wedding with up to 10 guests, photography, and champagne toast',
    priceCents: 249900, // $2,499
    photoUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop',
  });

  packages.set('pkg_garden', {
    id: 'pkg_garden',
    slug: 'garden-romance',
    title: 'Garden Romance',
    description: 'Outdoor garden ceremony with floral arch, photography, and reception for up to 20 guests',
    priceCents: 449900, // $4,499
    photoUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop',
  });

  packages.set('pkg_luxury', {
    id: 'pkg_luxury',
    slug: 'luxury-escape',
    title: 'Luxury Escape',
    description: 'Premium all-inclusive experience with venue, catering, photography, videography, and coordinator',
    priceCents: 899900, // $8,999
    photoUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop',
  });

  packages.set('pkg_destination', {
    id: 'pkg_destination',
    slug: 'destination-bliss',
    title: 'Destination Bliss',
    description: 'Beachfront or mountain ceremony with travel coordination, photography, and celebration dinner',
    priceCents: 599900, // $5,999
    photoUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&h=600&fit=crop',
  });

  packages.set('pkg_courthouse', {
    id: 'pkg_courthouse',
    slug: 'courthouse-chic',
    title: 'Courthouse Chic',
    description: 'Stylish courthouse wedding with photography, marriage license assistance, and celebration lunch',
    priceCents: 79900, // $799
    photoUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop',
  });

  // Add-ons
  addOns.set('addon_video', {
    id: 'addon_video',
    packageId: 'pkg_basic',
    title: 'Video Recording',
    priceCents: 50000, // $500
    photoUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop',
  });

  addOns.set('addon_flowers', {
    id: 'addon_flowers',
    packageId: 'pkg_basic',
    title: 'Floral Arrangement',
    priceCents: 15000, // $150
    photoUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop',
  });

  addOns.set('addon_makeup', {
    id: 'addon_makeup',
    packageId: 'pkg_micro',
    title: 'Hair & Makeup',
    priceCents: 30000, // $300
    photoUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop',
  });

  addOns.set('addon_music', {
    id: 'addon_music',
    packageId: 'pkg_garden',
    title: 'Live Music (Acoustic)',
    priceCents: 75000, // $750
    photoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop',
  });

  addOns.set('addon_cake', {
    id: 'addon_cake',
    packageId: 'pkg_garden',
    title: 'Custom Wedding Cake',
    priceCents: 35000, // $350
    photoUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=400&h=300&fit=crop',
  });

  addOns.set('addon_album', {
    id: 'addon_album',
    packageId: 'pkg_luxury',
    title: 'Premium Photo Album',
    priceCents: 45000, // $450
    photoUrl: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=400&h=300&fit=crop',
  });

  // Admin user
  const passwordHash = bcrypt.hashSync('admin123', 10);
  users.set('admin@elope.com', {
    id: 'user_admin',
    email: 'admin@elope.com',
    passwordHash,
    role: 'admin',
  });

  console.log('✅ Mock data seeded: 6 packages, 6 add-ons, 1 admin user');
}

// Initialize seed data
seedData();

// Mock Catalog Repository
export class MockCatalogRepository implements CatalogRepository {
  async getAllPackages(): Promise<Package[]> {
    return Array.from(packages.values());
  }

  async getPackageBySlug(slug: string): Promise<Package | null> {
    const pkg = Array.from(packages.values()).find((p) => p.slug === slug);
    return pkg || null;
  }

  async getPackageById(id: string): Promise<Package | null> {
    return packages.get(id) || null;
  }

  async getAddOnsByPackageId(packageId: string): Promise<AddOn[]> {
    return Array.from(addOns.values()).filter((a) => a.packageId === packageId);
  }

  async createPackage(data: {
    slug: string;
    title: string;
    description: string;
    priceCents: number;
    photoUrl?: string;
  }): Promise<Package> {
    // Check slug uniqueness
    const existing = await this.getPackageBySlug(data.slug);
    if (existing) {
      throw new Error(`Package with slug "${data.slug}" already exists`);
    }

    const pkg: Package = {
      id: `pkg_${Date.now()}`,
      ...data,
    };
    packages.set(pkg.id, pkg);
    return pkg;
  }

  async updatePackage(
    id: string,
    data: {
      slug?: string;
      title?: string;
      description?: string;
      priceCents?: number;
      photoUrl?: string;
    }
  ): Promise<Package> {
    const pkg = packages.get(id);
    if (!pkg) {
      throw new Error(`Package with id "${id}" not found`);
    }

    // Check slug uniqueness if updating slug
    if (data.slug && data.slug !== pkg.slug) {
      const existing = await this.getPackageBySlug(data.slug);
      if (existing) {
        throw new Error(`Package with slug "${data.slug}" already exists`);
      }
    }

    const updated: Package = {
      ...pkg,
      ...data,
    };
    packages.set(id, updated);
    return updated;
  }

  async deletePackage(id: string): Promise<void> {
    const pkg = packages.get(id);
    if (!pkg) {
      throw new Error(`Package with id "${id}" not found`);
    }

    // Also delete associated add-ons
    const packageAddOns = Array.from(addOns.values()).filter(
      (a) => a.packageId === id
    );
    packageAddOns.forEach((addOn) => addOns.delete(addOn.id));

    packages.delete(id);
  }

  async createAddOn(data: {
    packageId: string;
    title: string;
    priceCents: number;
    photoUrl?: string;
  }): Promise<AddOn> {
    // Verify package exists
    const pkg = packages.get(data.packageId);
    if (!pkg) {
      throw new Error(`Package with id "${data.packageId}" not found`);
    }

    const addOn: AddOn = {
      id: `addon_${Date.now()}`,
      ...data,
    };
    addOns.set(addOn.id, addOn);
    return addOn;
  }

  async updateAddOn(
    id: string,
    data: {
      packageId?: string;
      title?: string;
      priceCents?: number;
      photoUrl?: string;
    }
  ): Promise<AddOn> {
    const addOn = addOns.get(id);
    if (!addOn) {
      throw new Error(`AddOn with id "${id}" not found`);
    }

    // Verify package exists if updating packageId
    if (data.packageId && data.packageId !== addOn.packageId) {
      const pkg = packages.get(data.packageId);
      if (!pkg) {
        throw new Error(`Package with id "${data.packageId}" not found`);
      }
    }

    const updated: AddOn = {
      ...addOn,
      ...data,
    };
    addOns.set(id, updated);
    return updated;
  }

  async deleteAddOn(id: string): Promise<void> {
    const addOn = addOns.get(id);
    if (!addOn) {
      throw new Error(`AddOn with id "${id}" not found`);
    }
    addOns.delete(id);
  }
}

// Mock Booking Repository
export class MockBookingRepository implements BookingRepository {
  async create(booking: Booking): Promise<Booking> {
    const dateKey = toUtcMidnight(booking.eventDate);

    // Enforce unique by date
    if (bookingsByDate.has(dateKey)) {
      throw new BookingConflictError(dateKey);
    }

    bookings.set(booking.id, booking);
    bookingsByDate.set(dateKey, booking.id);
    return booking;
  }

  async findById(id: string): Promise<Booking | null> {
    return bookings.get(id) || null;
  }

  async findAll(): Promise<Booking[]> {
    return Array.from(bookings.values());
  }

  async isDateBooked(date: string): Promise<boolean> {
    const dateKey = toUtcMidnight(date);
    return bookingsByDate.has(dateKey);
  }
}

// Mock Blackout Repository
export class MockBlackoutRepository implements BlackoutRepository {
  async isBlackoutDate(date: string): Promise<boolean> {
    const dateKey = toUtcMidnight(date);
    return blackouts.has(dateKey);
  }

  async getAllBlackouts(): Promise<Array<{ date: string; reason?: string }>> {
    return Array.from(blackouts.values());
  }

  async addBlackout(date: string, reason?: string): Promise<void> {
    const dateKey = toUtcMidnight(date);
    blackouts.set(dateKey, { date: dateKey, reason });
  }
}

// Mock Calendar Provider
export class MockCalendarProvider implements CalendarProvider {
  async isDateAvailable(date: string): Promise<boolean> {
    const dateKey = toUtcMidnight(date);
    return !calendarBusyDates.has(dateKey);
  }

  // Helper method to mark dates as busy (for testing)
  markBusy(date: string): void {
    const dateKey = toUtcMidnight(date);
    calendarBusyDates.add(dateKey);
  }
}

// Mock Payment Provider
export class MockPaymentProvider implements PaymentProvider {
  async createCheckoutSession(input: {
    amountCents: number;
    email: string;
    metadata: Record<string, string>;
  }): Promise<CheckoutSession> {
    const sessionId = `mock_session_${Date.now()}`;
    const successUrl = input.metadata.successUrl || 'http://localhost:5173/success';
    const checkoutUrl = `${successUrl}?session_id=${sessionId}&mock=1`;

    return {
      url: checkoutUrl,
      sessionId,
    };
  }

  async verifyWebhook(
    _payload: string,
    _signature: string
  ): Promise<{ type: string; data: { id: string } }> {
    // Mock webhook verification - always succeeds
    return {
      type: 'checkout.session.completed',
      data: {
        id: 'mock_session_verified',
      },
    };
  }
}

// Mock Email Provider
export class MockEmailProvider implements EmailProvider {
  async sendEmail(input: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    console.log('📧 [MOCK EMAIL]');
    console.log(`  To: ${input.to}`);
    console.log(`  Subject: ${input.subject}`);
    console.log(`  Body: ${input.html.substring(0, 100)}...`);
  }
}

// Mock User Repository
export class MockUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return users.get(email) || null;
  }
}

// Export builder function
export function buildMockAdapters() {
  return {
    catalogRepo: new MockCatalogRepository(),
    bookingRepo: new MockBookingRepository(),
    blackoutRepo: new MockBlackoutRepository(),
    calendarProvider: new MockCalendarProvider(),
    paymentProvider: new MockPaymentProvider(),
    emailProvider: new MockEmailProvider(),
    userRepo: new MockUserRepository(),
  };
}

/**
 * Get current in-memory state for debugging (dev mode only)
 */
export function getMockState() {
  return {
    packages: Array.from(packages.values()),
    addOns: Array.from(addOns.values()),
    blackouts: Array.from(blackouts.values()),
    bookings: Array.from(bookings.values()),
  };
}
