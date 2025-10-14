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
    description: 'Simple, intimate ceremony with professional photography',
    priceCents: 100000, // $1,000
    photoUrl: '/images/basic.jpg',
  });

  packages.set('pkg_micro', {
    id: 'pkg_micro',
    slug: 'micro-ceremony',
    title: 'Micro Ceremony',
    description: 'Intimate micro-wedding with up to 10 guests',
    priceCents: 250000, // $2,500
    photoUrl: '/images/micro.jpg',
  });

  // Add-ons
  addOns.set('addon_video', {
    id: 'addon_video',
    packageId: 'pkg_basic',
    title: 'Video Recording',
    priceCents: 50000, // $500
    photoUrl: '/images/video.jpg',
  });

  addOns.set('addon_flowers', {
    id: 'addon_flowers',
    packageId: 'pkg_basic',
    title: 'Floral Arrangement',
    priceCents: 15000, // $150
    photoUrl: '/images/flowers.jpg',
  });

  addOns.set('addon_makeup', {
    id: 'addon_makeup',
    packageId: 'pkg_micro',
    title: 'Hair & Makeup',
    priceCents: 30000, // $300
    photoUrl: '/images/makeup.jpg',
  });

  // Admin user
  const passwordHash = bcrypt.hashSync('admin123', 10);
  users.set('admin@elope.com', {
    id: 'user_admin',
    email: 'admin@elope.com',
    passwordHash,
    role: 'admin',
  });

  console.log('✅ Mock data seeded: 2 packages, 3 add-ons, 1 admin user');
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

  async getAddOnsByPackageId(packageId: string): Promise<AddOn[]> {
    return Array.from(addOns.values()).filter((a) => a.packageId === packageId);
  }
}

// Mock Booking Repository
export class MockBookingRepository implements BookingRepository {
  async create(booking: Booking): Promise<Booking> {
    const dateKey = toUtcMidnight(booking.eventDate);

    // Enforce unique by date
    if (bookingsByDate.has(dateKey)) {
      throw new Error(`Date ${dateKey} is already booked`);
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
