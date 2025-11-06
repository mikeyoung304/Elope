/**
 * Availability HTTP controller
 */

import type { AvailabilityService } from '../services/availability.service';
import type { AvailabilityDto } from '@elope/contracts';

export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  async getAvailability(date: string): Promise<AvailabilityDto> {
    const result = await this.availabilityService.checkAvailability(date);
    return {
      date: result.date,
      available: result.available,
      reason: result.reason,
    };
  }

  async getUnavailableDates(startDate: string, endDate: string): Promise<{ dates: string[] }> {
    const dates = await this.availabilityService.getUnavailableDates(
      new Date(startDate),
      new Date(endDate)
    );
    return { dates };
  }
}
