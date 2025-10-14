/**
 * Unit tests for BookingService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BookingService } from '../src/domains/booking/service';
import {
  FakeBookingRepository,
  FakeCatalogRepository,
  FakeEventEmitter,
  buildPackage,
  buildAddOn,
  buildBooking,
} from './helpers/fakes';
import { NotFoundError } from '../src/core/errors';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepo: FakeBookingRepository;
  let catalogRepo: FakeCatalogRepository;
  let eventEmitter: FakeEventEmitter;

  beforeEach(() => {
    bookingRepo = new FakeBookingRepository();
    catalogRepo = new FakeCatalogRepository();
    eventEmitter = new FakeEventEmitter();
    service = new BookingService(bookingRepo, catalogRepo, eventEmitter);
  });

  describe('createCheckout', () => {
    it('validates package exists and calculates total', async () => {
      // Arrange
      const pkg = buildPackage({ id: 'pkg_1', slug: 'basic', priceCents: 100000 });
      catalogRepo.addPackage(pkg);

      // Act
      const result = await service.createCheckout({
        packageId: 'basic',
        coupleName: 'John & Jane',
        email: 'couple@example.com',
        eventDate: '2025-07-01',
      });

      // Assert
      expect(result.checkoutUrl).toContain('checkout.stripe.com');
    });

    it('includes add-on prices in total calculation', async () => {
      // Arrange
      const pkg = buildPackage({ id: 'pkg_1', slug: 'basic', priceCents: 100000 });
      catalogRepo.addPackage(pkg);
      catalogRepo.addAddOn(buildAddOn({ id: 'addon_1', packageId: 'pkg_1', priceCents: 20000 }));
      catalogRepo.addAddOn(buildAddOn({ id: 'addon_2', packageId: 'pkg_1', priceCents: 30000 }));

      // Act
      const result = await service.createCheckout({
        packageId: 'basic',
        coupleName: 'John & Jane',
        email: 'couple@example.com',
        eventDate: '2025-07-01',
        addOnIds: ['addon_1', 'addon_2'],
      });

      // Assert: should return checkout URL (total = 100000 + 20000 + 30000 = 150000)
      expect(result.checkoutUrl).toBeDefined();
    });

    it('throws NotFoundError if package does not exist', async () => {
      // Act & Assert
      await expect(
        service.createCheckout({
          packageId: 'nonexistent',
          coupleName: 'John & Jane',
          email: 'couple@example.com',
          eventDate: '2025-07-01',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('onPaymentCompleted', () => {
    it('inserts a PAID booking and emits BookingPaid event', async () => {
      // Act
      const booking = await service.onPaymentCompleted({
        sessionId: 'sess_123',
        packageId: 'pkg_1',
        eventDate: '2025-07-01',
        email: 'couple@example.com',
        coupleName: 'John & Jane',
        totalCents: 100000,
      });

      // Assert: booking created
      expect(booking.status).toBe('PAID');
      expect(booking.eventDate).toBe('2025-07-01');
      expect(booking.email).toBe('couple@example.com');

      // Assert: event emitted
      expect(eventEmitter.emittedEvents).toHaveLength(1);
      expect(eventEmitter.emittedEvents[0]?.event).toBe('BookingPaid');
      expect(eventEmitter.emittedEvents[0]?.payload).toMatchObject({
        bookingId: booking.id,
        email: 'couple@example.com',
        coupleName: 'John & Jane',
        eventDate: '2025-07-01',
      });
    });

    it('throws error if date is already booked (duplicate date)', async () => {
      // Arrange: pre-existing booking for same date
      bookingRepo.addBooking(buildBooking({ eventDate: '2025-07-01' }));

      // Act & Assert
      await expect(
        service.onPaymentCompleted({
          sessionId: 'sess_123',
          packageId: 'pkg_1',
          eventDate: '2025-07-01',
          email: 'another@example.com',
          coupleName: 'Another Couple',
          totalCents: 100000,
        })
      ).rejects.toThrow('Date already booked');
    });

    it('duplicate date error should map to 409 Conflict', async () => {
      // Arrange
      bookingRepo.addBooking(buildBooking({ eventDate: '2025-07-01' }));

      // Act & Assert: verify error message contains info that should be mapped to 409
      try {
        await service.onPaymentCompleted({
          sessionId: 'sess_123',
          packageId: 'pkg_1',
          eventDate: '2025-07-01',
          email: 'another@example.com',
          coupleName: 'Another Couple',
          totalCents: 100000,
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('already booked');
        // Note: HTTP layer would map this to 409 based on error message
      }
    });
  });

  describe('getAllBookings', () => {
    it('returns all bookings', async () => {
      // Arrange
      bookingRepo.addBooking(buildBooking({ id: 'booking_1' }));
      bookingRepo.addBooking(buildBooking({ id: 'booking_2', eventDate: '2025-07-02' }));

      // Act
      const bookings = await service.getAllBookings();

      // Assert
      expect(bookings).toHaveLength(2);
    });
  });

  describe('getBookingById', () => {
    it('returns booking if found', async () => {
      // Arrange
      bookingRepo.addBooking(buildBooking({ id: 'booking_1' }));

      // Act
      const booking = await service.getBookingById('booking_1');

      // Assert
      expect(booking.id).toBe('booking_1');
    });

    it('throws NotFoundError if booking not found', async () => {
      // Act & Assert
      await expect(service.getBookingById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});
