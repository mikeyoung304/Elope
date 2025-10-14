/**
 * Unit tests for AvailabilityService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AvailabilityService } from '../src/domains/availability/service';
import {
  FakeCalendarProvider,
  FakeBlackoutRepository,
  FakeBookingRepository,
  buildBooking,
} from './helpers/fakes';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let calendarProvider: FakeCalendarProvider;
  let blackoutRepo: FakeBlackoutRepository;
  let bookingRepo: FakeBookingRepository;

  beforeEach(() => {
    calendarProvider = new FakeCalendarProvider();
    blackoutRepo = new FakeBlackoutRepository();
    bookingRepo = new FakeBookingRepository();
    service = new AvailabilityService(calendarProvider, blackoutRepo, bookingRepo);
  });

  it('returns available when no booking, blackout, or busy', async () => {
    const result = await service.checkAvailability('2025-07-01');

    expect(result).toEqual({
      date: '2025-07-01',
      available: true,
    });
  });

  it('returns unavailable "booked" if date is booked', async () => {
    // Arrange: add a booking for the date
    bookingRepo.addBooking(buildBooking({ eventDate: '2025-07-01' }));

    // Act
    const result = await service.checkAvailability('2025-07-01');

    // Assert
    expect(result).toEqual({
      date: '2025-07-01',
      available: false,
      reason: 'booked',
    });
  });

  it('returns unavailable "blackout" if date is blackout', async () => {
    // Arrange: add a blackout date
    await blackoutRepo.addBlackout('2025-07-01', 'Holiday');

    // Act
    const result = await service.checkAvailability('2025-07-01');

    // Assert
    expect(result).toEqual({
      date: '2025-07-01',
      available: false,
      reason: 'blackout',
    });
  });

  it('returns unavailable "calendar" if external calendar is busy', async () => {
    // Arrange: set calendar as busy
    calendarProvider.setBusyDates(['2025-07-01']);

    // Act
    const result = await service.checkAvailability('2025-07-01');

    // Assert
    expect(result).toEqual({
      date: '2025-07-01',
      available: false,
      reason: 'calendar',
    });
  });

  it('prioritizes blackout over booked in availability check', async () => {
    // Arrange: both blackout and booked
    await blackoutRepo.addBlackout('2025-07-01');
    bookingRepo.addBooking(buildBooking({ eventDate: '2025-07-01' }));

    // Act
    const result = await service.checkAvailability('2025-07-01');

    // Assert: blackout is checked first
    expect(result.reason).toBe('blackout');
  });

  it('prioritizes booked over calendar busy', async () => {
    // Arrange: both booked and calendar busy
    bookingRepo.addBooking(buildBooking({ eventDate: '2025-07-01' }));
    calendarProvider.setBusyDates(['2025-07-01']);

    // Act
    const result = await service.checkAvailability('2025-07-01');

    // Assert: booked is checked before calendar
    expect(result.reason).toBe('booked');
  });
});
