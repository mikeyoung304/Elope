/**
 * Test fakes and builders for unit tests
 */

import type { BookingRepository } from '../../src/domains/booking/port';
import type { Booking } from '../../src/domains/booking/entities';
import { BookingConflictError } from '../../src/domains/booking/errors';
import type { CatalogRepository } from '../../src/domains/catalog/port';
import type { Package, AddOn } from '../../src/domains/catalog/entities';
import type { BlackoutRepository, CalendarProvider } from '../../src/domains/availability/port';
import type { PaymentProvider, CheckoutSession } from '../../src/domains/payments/port';
import type { EmailProvider } from '../../src/domains/notifications/port';
import type { UserRepository, User } from '../../src/domains/identity/port';
import type { EventEmitter } from '../../src/core/events';

// --- Fake Repositories ---

export class FakeBookingRepository implements BookingRepository {
  private bookings: Booking[] = [];

  async create(booking: Booking): Promise<Booking> {
    // Enforce unique-by-date constraint
    const exists = this.bookings.some((b) => b.eventDate === booking.eventDate);
    if (exists) {
      throw new BookingConflictError(booking.eventDate);
    }
    this.bookings.push(booking);
    return booking;
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.find((b) => b.id === id) || null;
  }

  async findAll(): Promise<Booking[]> {
    return [...this.bookings];
  }

  async isDateBooked(date: string): Promise<boolean> {
    return this.bookings.some((b) => b.eventDate === date);
  }

  // Test helper
  addBooking(booking: Booking): void {
    this.bookings.push(booking);
  }

  clear(): void {
    this.bookings = [];
  }
}

export class FakeCatalogRepository implements CatalogRepository {
  private packages: Package[] = [];
  private addOns: AddOn[] = [];

  async getAllPackages(): Promise<Package[]> {
    return [...this.packages];
  }

  async getPackageBySlug(slug: string): Promise<Package | null> {
    return this.packages.find((p) => p.slug === slug) || null;
  }

  async getPackageById(id: string): Promise<Package | null> {
    return this.packages.find((p) => p.id === id) || null;
  }

  async getAddOnsByPackageId(packageId: string): Promise<AddOn[]> {
    return this.addOns.filter((a) => a.packageId === packageId);
  }

  async createPackage(data: {
    slug: string;
    title: string;
    description: string;
    priceCents: number;
    photoUrl?: string;
  }): Promise<Package> {
    const pkg: Package = {
      id: `pkg_${Date.now()}_${Math.random()}`,
      ...data,
    };
    this.packages.push(pkg);
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
    const index = this.packages.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Package with id "${id}" not found`);
    }

    const updated: Package = {
      ...this.packages[index],
      ...data,
    };
    this.packages[index] = updated;
    return updated;
  }

  async deletePackage(id: string): Promise<void> {
    const index = this.packages.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Package with id "${id}" not found`);
    }
    this.packages.splice(index, 1);
    // Also delete associated add-ons
    this.addOns = this.addOns.filter((a) => a.packageId !== id);
  }

  async createAddOn(data: {
    packageId: string;
    title: string;
    priceCents: number;
    photoUrl?: string;
  }): Promise<AddOn> {
    const addOn: AddOn = {
      id: `addon_${Date.now()}_${Math.random()}`,
      ...data,
    };
    this.addOns.push(addOn);
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
    const index = this.addOns.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`AddOn with id "${id}" not found`);
    }

    const updated: AddOn = {
      ...this.addOns[index],
      ...data,
    };
    this.addOns[index] = updated;
    return updated;
  }

  async deleteAddOn(id: string): Promise<void> {
    const index = this.addOns.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`AddOn with id "${id}" not found`);
    }
    this.addOns.splice(index, 1);
  }

  // Test helpers
  addPackage(pkg: Package): void {
    this.packages.push(pkg);
  }

  addAddOn(addOn: AddOn): void {
    this.addOns.push(addOn);
  }

  clear(): void {
    this.packages = [];
    this.addOns = [];
  }
}

export class FakeBlackoutRepository implements BlackoutRepository {
  private blackouts: Array<{ date: string; reason?: string }> = [];

  async isBlackoutDate(date: string): Promise<boolean> {
    return this.blackouts.some((b) => b.date === date);
  }

  async getAllBlackouts(): Promise<Array<{ date: string; reason?: string }>> {
    return [...this.blackouts];
  }

  async addBlackout(date: string, reason?: string): Promise<void> {
    this.blackouts.push({ date, reason });
  }

  // Test helper
  clear(): void {
    this.blackouts = [];
  }
}

export class FakeCalendarProvider implements CalendarProvider {
  private busyDates: string[] = [];

  async isDateAvailable(date: string): Promise<boolean> {
    return !this.busyDates.includes(date);
  }

  // Test helpers
  setBusyDates(dates: string[]): void {
    this.busyDates = dates;
  }

  clear(): void {
    this.busyDates = [];
  }
}

export class FakePaymentProvider implements PaymentProvider {
  async createCheckoutSession(input: {
    amountCents: number;
    email: string;
    metadata: Record<string, string>;
  }): Promise<CheckoutSession> {
    return {
      url: `https://fake-checkout.com/session_${Date.now()}`,
      sessionId: `sess_${Date.now()}`,
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<unknown> {
    return { verified: true };
  }
}

export class FakeEmailProvider implements EmailProvider {
  public sentEmails: Array<{ to: string; subject: string; html: string }> = [];

  async sendEmail(input: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    this.sentEmails.push(input);
  }

  // Test helper
  clear(): void {
    this.sentEmails = [];
  }
}

export class FakeUserRepository implements UserRepository {
  private users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) || null;
  }

  // Test helper
  addUser(user: User): void {
    this.users.push(user);
  }

  clear(): void {
    this.users = [];
  }
}

export class FakeEventEmitter implements EventEmitter {
  private handlers: Map<string, Array<(payload: unknown) => void | Promise<void>>> = new Map();
  public emittedEvents: Array<{ event: string; payload: unknown }> = [];

  subscribe<T>(event: string, handler: (payload: T) => void | Promise<void>): void {
    const existing = this.handlers.get(event) || [];
    this.handlers.set(event, [...existing, handler as (payload: unknown) => void | Promise<void>]);
  }

  async emit<T>(event: string, payload: T): Promise<void> {
    this.emittedEvents.push({ event, payload });
    const handlers = this.handlers.get(event) || [];
    await Promise.all(handlers.map((handler) => handler(payload)));
  }

  // Test helpers
  clear(): void {
    this.emittedEvents = [];
    this.handlers.clear();
  }
}

// --- Builders ---

export function buildPackage(overrides?: Partial<Package>): Package {
  return {
    id: 'pkg_1',
    slug: 'basic-package',
    title: 'Basic Package',
    description: 'A basic photography package',
    priceCents: 100000,
    ...overrides,
  };
}

export function buildAddOn(overrides?: Partial<AddOn>): AddOn {
  return {
    id: 'addon_1',
    packageId: 'pkg_1',
    title: 'Extra Hour',
    priceCents: 20000,
    ...overrides,
  };
}

export function buildBooking(overrides?: Partial<Booking>): Booking {
  return {
    id: 'booking_1',
    packageId: 'pkg_1',
    coupleName: 'John & Jane',
    email: 'couple@example.com',
    eventDate: '2025-06-15',
    addOnIds: [],
    totalCents: 100000,
    status: 'PAID',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildUser(overrides?: Partial<User>): User {
  return {
    id: 'user_1',
    email: 'admin@example.com',
    passwordHash: '$2a$10$FAKEHASH',
    role: 'admin',
    ...overrides,
  };
}
