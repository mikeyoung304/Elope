/**
 * Prisma Booking Repository Adapter
 */

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { PrismaClient } from '../../generated/prisma';
import type { BookingRepository } from '../lib/ports';
import type { Booking } from '../lib/entities';
import { BookingConflictError, BookingLockTimeoutError } from '../lib/errors';
import { logger } from '../../lib/core/logger';
import { toISODate } from '../lib/date-utils';

// Transaction configuration for booking creation
const BOOKING_TRANSACTION_TIMEOUT_MS = 5000;  // 5 seconds
const BOOKING_ISOLATION_LEVEL = 'Serializable' as const;

export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Creates a new booking with advanced race condition protection
   *
   * Implements multi-layered concurrency control to prevent double-bookings:
   * 1. SERIALIZABLE transaction isolation level (strongest consistency)
   * 2. FOR UPDATE NOWAIT pessimistic lock on the booking date
   * 3. Explicit date availability check after lock acquisition
   * 4. Unique constraint enforcement at database level
   *
   * Transaction configuration:
   * - Timeout: 5 seconds (BOOKING_TRANSACTION_TIMEOUT_MS)
   * - Isolation: SERIALIZABLE (prevents phantom reads)
   *
   * Lock acquisition strategy:
   * - Uses NOWAIT to fail fast on contention (prevents queue buildup)
   * - Returns BookingLockTimeoutError if lock cannot be acquired
   * - Detects PostgreSQL error code P2034 for timeout handling
   *
   * @param booking - Domain booking entity to persist
   *
   * @returns Created booking with generated timestamps
   *
   * @throws {BookingConflictError} If date is already booked (P2002 unique constraint)
   * @throws {BookingLockTimeoutError} If transaction lock cannot be acquired (P2034)
   *
   * @example
   * ```typescript
   * try {
   *   const booking = await repository.create({
   *     id: 'booking_123',
   *     packageId: 'pkg_abc',
   *     eventDate: '2025-06-15',
   *     coupleName: 'Jane & John',
   *     email: 'couple@example.com',
   *     addOnIds: ['addon_1'],
   *     totalCents: 150000,
   *     status: 'PAID',
   *     createdAt: new Date().toISOString()
   *   });
   * } catch (error) {
   *   if (error instanceof BookingConflictError) {
   *     // Date already booked - show user alternative dates
   *   } else if (error instanceof BookingLockTimeoutError) {
   *     // High contention - retry with exponential backoff
   *   }
   * }
   * ```
   */
  async create(tenantId: string, booking: Booking): Promise<Booking> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Lock the date to prevent concurrent bookings for this tenant
        const lockQuery = `
          SELECT 1 FROM "Booking"
          WHERE "tenantId" = $1 AND date = $2
          FOR UPDATE NOWAIT
        `;

        try {
          await tx.$queryRawUnsafe(lockQuery, tenantId, new Date(booking.eventDate));
        } catch (lockError) {
          // Check specific PostgreSQL error codes
          if (lockError instanceof PrismaClientKnownRequestError) {
            // P2034 = Transaction failed due to lock timeout
            if (lockError.code === 'P2034') {
              logger.warn({ tenantId, date: booking.eventDate, error: lockError.code }, 'Lock timeout on booking date');
              throw new BookingLockTimeoutError(booking.eventDate);
            }
          }

          // Log unexpected errors for debugging
          logger.error({
            error: lockError,
            tenantId,
            date: booking.eventDate,
            query: lockQuery
          }, 'Unexpected error during lock acquisition');

          // Re-throw to prevent masking real database issues
          throw lockError;
        }

        // Check if date is already booked for this tenant
        const existing = await tx.booking.findFirst({
          where: { tenantId, date: new Date(booking.eventDate) }
        });

        if (existing) {
          throw new BookingConflictError(booking.eventDate);
        }

        // Create or find the customer (tenant-scoped)
        const customer = await tx.customer.upsert({
          where: {
            tenantId_email: {
              tenantId,
              email: booking.email,
            },
          },
          update: {
            name: booking.coupleName,
            phone: booking.phone,
          },
          create: {
            tenantId,
            email: booking.email,
            name: booking.coupleName,
            phone: booking.phone,
          },
        });

        // Fetch actual add-on prices for accurate financial records
        const addOnPrices = new Map<string, number>();
        if (booking.addOnIds.length > 0) {
          const addOns = await tx.addOn.findMany({
            where: {
              tenantId,
              id: { in: booking.addOnIds },
            },
            select: { id: true, price: true },
          });
          addOns.forEach(a => addOnPrices.set(a.id, a.price));
        }

        // Create booking with tenant isolation
        const created = await tx.booking.create({
          data: {
            id: booking.id,
            tenantId,
            customerId: customer.id,
            packageId: booking.packageId,
            date: new Date(booking.eventDate),
            totalPrice: booking.totalCents,
            status: this.mapToPrismaStatus(booking.status),
            addOns: {
              create: booking.addOnIds.map((addOnId) => ({
                addOnId,
                quantity: 1,
                unitPrice: addOnPrices.get(addOnId) || 0,
              })),
            },
          },
          include: {
            customer: true,
            addOns: {
              select: {
                addOnId: true,
              },
            },
          },
        });

        return this.toDomainBooking(created);
      }, {
        timeout: BOOKING_TRANSACTION_TIMEOUT_MS,
        isolationLevel: BOOKING_ISOLATION_LEVEL as any,
      });
    } catch (error) {
      // Handle unique constraint violation on eventDate
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BookingConflictError(booking.eventDate);
      }
      // Re-throw our custom errors
      if (error instanceof BookingLockTimeoutError || error instanceof BookingConflictError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Retrieves a single booking by ID with related customer and add-on data
   *
   * @param id - Booking identifier
   *
   * @returns Domain booking entity or null if not found
   *
   * @example
   * ```typescript
   * const booking = await repository.findById('booking_123');
   * if (booking) {
   *   console.log(`Booking for ${booking.coupleName} on ${booking.eventDate}`);
   * }
   * ```
   */
  async findById(tenantId: string, id: string): Promise<Booking | null> {
    const booking = await this.prisma.booking.findFirst({
      where: { tenantId, id },
      include: {
        customer: true,
        addOns: {
          select: {
            addOnId: true,
          },
        },
      },
    });

    return booking ? this.toDomainBooking(booking) : null;
  }

  /**
   * Retrieves all bookings ordered by creation date (most recent first)
   *
   * Includes full customer and add-on relationship data for each booking.
   *
   * @returns Array of domain booking entities
   *
   * @example
   * ```typescript
   * const bookings = await repository.findAll();
   * console.log(`Total bookings: ${bookings.length}`);
   * ```
   */
  async findAll(tenantId: string): Promise<Booking[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        addOns: {
          select: {
            addOnId: true,
          },
        },
      },
    });

    return bookings.map((b) => this.toDomainBooking(b));
  }

  /**
   * Checks if a specific date already has a booking
   *
   * Used for availability checks in the date picker and availability service.
   *
   * @param date - Date string in YYYY-MM-DD format
   *
   * @returns True if date is booked, false if available
   *
   * @example
   * ```typescript
   * const isBooked = await repository.isDateBooked('2025-06-15');
   * if (isBooked) {
   *   console.log('Date unavailable - already booked');
   * }
   * ```
   */
  async isDateBooked(tenantId: string, date: string): Promise<boolean> {
    const booking = await this.prisma.booking.findFirst({
      where: { tenantId, date: new Date(date) },
    });

    return booking !== null;
  }

  /**
   * Retrieves all unavailable booking dates within a date range
   *
   * Performs batch query to fetch booked dates efficiently (avoids N queries).
   * Only returns dates with CONFIRMED or PENDING status (excludes CANCELED/FULFILLED).
   *
   * @param startDate - Start of date range (inclusive)
   * @param endDate - End of date range (inclusive)
   *
   * @returns Array of booked Date objects
   *
   * @example
   * ```typescript
   * const unavailable = await repository.getUnavailableDates(
   *   new Date('2025-06-01'),
   *   new Date('2025-06-30')
   * );
   * // Returns: [Date('2025-06-15'), Date('2025-06-22'), ...]
   * ```
   */
  async getUnavailableDates(tenantId: string, startDate: Date, endDate: Date): Promise<Date[]> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['CONFIRMED', 'PENDING'], // Exclude CANCELED and FULFILLED
        },
      },
      select: {
        date: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return bookings.map(b => b.date);
  }

  // Mappers
  private mapToPrismaStatus(status: string): 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'FULFILLED' {
    switch (status) {
      case 'PAID':
        return 'CONFIRMED';
      case 'CANCELED':
        return 'CANCELED';
      case 'REFUNDED':
        return 'CANCELED';
      default:
        return 'PENDING';
    }
  }

  private toDomainBooking(booking: {
    id: string;
    packageId: string;
    date: Date;
    totalPrice: number;
    status: string;
    createdAt: Date;
    customer: {
      name: string;
      email: string | null;
      phone: string | null;
    };
    addOns: { addOnId: string }[];
  }): Booking {
    // Map Prisma BookingStatus to domain status
    const mapStatus = (prismaStatus: string): 'PAID' | 'REFUNDED' | 'CANCELED' => {
      switch (prismaStatus) {
        case 'FULFILLED':
        case 'CONFIRMED':
          return 'PAID';
        case 'CANCELED':
          // NOTE: Cannot distinguish between CANCELED and REFUNDED
          // Consider adding refundedAt field to schema for proper distinction
          return 'CANCELED';
        default:
          return 'PAID'; // Default to PAID for PENDING
      }
    };

    return {
      id: booking.id,
      packageId: booking.packageId,
      coupleName: booking.customer.name,
      email: booking.customer.email || '',
      ...(booking.customer.phone && { phone: booking.customer.phone }),
      eventDate: toISODate(booking.date),
      addOnIds: booking.addOns.map((a) => a.addOnId),
      totalCents: booking.totalPrice,
      status: mapStatus(booking.status),
      createdAt: booking.createdAt.toISOString(),
    };
  }
}
