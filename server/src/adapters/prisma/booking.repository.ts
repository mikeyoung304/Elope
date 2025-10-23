/**
 * Prisma Booking Repository Adapter
 */

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { PrismaClient } from '../../generated/prisma';
import type { BookingRepository } from '../lib/ports';
import type { Booking } from '../lib/entities';
import { BookingConflictError } from '../lib/errors';

export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(booking: Booking): Promise<Booking> {
    try {
      const created = await this.prisma.booking.create({
        data: {
          id: booking.id,
          packageId: booking.packageId,
          coupleName: booking.coupleName,
          email: booking.email,
          phone: booking.phone,
          eventDate: new Date(booking.eventDate),
          addOnIds: booking.addOnIds,
          totalCents: booking.totalCents,
          status: booking.status,
          createdAt: new Date(booking.createdAt),
        },
      });

      return this.toDomainBooking(created);
    } catch (error) {
      // Handle unique constraint violation on eventDate
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BookingConflictError(booking.eventDate);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Booking | null> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    return booking ? this.toDomainBooking(booking) : null;
  }

  async findAll(): Promise<Booking[]> {
    const bookings = await this.prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => this.toDomainBooking(b));
  }

  async isDateBooked(date: string): Promise<boolean> {
    const booking = await this.prisma.booking.findUnique({
      where: { eventDate: new Date(date) },
    });

    return booking !== null;
  }

  // Mapper
  private toDomainBooking(booking: {
    id: string;
    packageId: string;
    coupleName: string;
    email: string;
    phone: string | null;
    eventDate: Date;
    addOnIds: string[];
    totalCents: number;
    status: 'PAID' | 'REFUNDED' | 'CANCELED';
    createdAt: Date;
  }): Booking {
    return {
      id: booking.id,
      packageId: booking.packageId,
      coupleName: booking.coupleName,
      email: booking.email,
      ...(booking.phone && { phone: booking.phone }),
      eventDate: booking.eventDate.toISOString().split('T')[0], // YYYY-MM-DD
      addOnIds: booking.addOnIds,
      totalCents: booking.totalCents,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    };
  }
}
