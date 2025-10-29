/**
 * Prisma Booking Repository Adapter
 */

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { PrismaClient } from '../../generated/prisma';
import type { BookingRepository } from '../lib/ports';
import type { Booking } from '../lib/entities';
import { BookingConflictError, BookingLockTimeoutError } from '../lib/errors';

export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(booking: Booking): Promise<Booking> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Lock the date to prevent concurrent bookings
        const lockQuery = `
          SELECT 1 FROM "Booking"
          WHERE date = $1
          FOR UPDATE NOWAIT
        `;

        try {
          await tx.$queryRawUnsafe(lockQuery, new Date(booking.eventDate));
        } catch (lockError) {
          // Lock timeout or already locked - throw specific error
          throw new BookingLockTimeoutError(booking.eventDate);
        }

        // Check if date is already booked
        const existing = await tx.booking.findFirst({
          where: { date: new Date(booking.eventDate) }
        });

        if (existing) {
          throw new BookingConflictError(booking.eventDate);
        }

        // Create or find the customer
        const customer = await tx.customer.upsert({
          where: { email: booking.email },
          update: {
            name: booking.coupleName,
            phone: booking.phone,
          },
          create: {
            email: booking.email,
            name: booking.coupleName,
            phone: booking.phone,
          },
        });

        // Create booking
        const created = await tx.booking.create({
          data: {
            id: booking.id,
            customerId: customer.id,
            packageId: booking.packageId,
            date: new Date(booking.eventDate),
            totalPrice: booking.totalCents,
            status: this.mapToPrismaStatus(booking.status),
            addOns: {
              create: booking.addOnIds.map((addOnId) => ({
                addOnId,
                quantity: 1,
                unitPrice: 0, // This should ideally come from the AddOn price
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
        timeout: 5000, // 5 second timeout
        isolationLevel: 'Serializable' // Strongest isolation
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

  async findById(id: string): Promise<Booking | null> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
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

  async findAll(): Promise<Booking[]> {
    const bookings = await this.prisma.booking.findMany({
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

  async isDateBooked(date: string): Promise<boolean> {
    const booking = await this.prisma.booking.findFirst({
      where: { date: new Date(date) },
    });

    return booking !== null;
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
      eventDate: booking.date.toISOString().split('T')[0], // YYYY-MM-DD
      addOnIds: booking.addOns.map((a) => a.addOnId),
      totalCents: booking.totalPrice,
      status: mapStatus(booking.status),
      createdAt: booking.createdAt.toISOString(),
    };
  }
}
