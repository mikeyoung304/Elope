/**
 * Google Calendar adapter with freeBusy API and caching
 */

import type { CalendarProvider } from '../domains/availability/port';
import { createGServiceAccountJWT } from './gcal.jwt';
import { logger } from '../core/logger';

interface CacheEntry {
  available: boolean;
  timestamp: number;
}

interface FreeBusyResponse {
  calendars?: {
    [calendarId: string]: {
      busy?: Array<{ start: string; end: string }>;
    };
  };
}

export class GoogleCalendarAdapter implements CalendarProvider {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 60_000; // 60 seconds

  constructor(
    private readonly config: {
      calendarId?: string;
      serviceAccountJsonBase64?: string;
    }
  ) {}

  async isDateAvailable(dateUtc: string): Promise<boolean> {
    const cacheKey = dateUtc;
    const cached = this.cache.get(cacheKey);

    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.available;
    }

    // Check if credentials are missing
    if (!this.config.calendarId || !this.config.serviceAccountJsonBase64) {
      if (!cached) {
        logger.warn('Google Calendar credentials missing; treating date as available');
      }
      const result = { available: true, timestamp: Date.now() };
      this.cache.set(cacheKey, result);
      return true;
    }

    try {
      // Parse service account JSON from base64
      const serviceAccountJson = JSON.parse(
        Buffer.from(this.config.serviceAccountJsonBase64, 'base64').toString('utf8')
      );

      // Get access token via JWT
      const accessToken = await createGServiceAccountJWT(serviceAccountJson, [
        'https://www.googleapis.com/auth/calendar.readonly',
      ]);

      // Query freeBusy for the entire day (UTC)
      const timeMin = `${dateUtc}T00:00:00.000Z`;
      const timeMax = `${dateUtc}T23:59:59.999Z`;

      const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: this.config.calendarId }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        logger.warn(
          { status: response.status, error: errorText, date: dateUtc },
          'Google Calendar freeBusy API failed; assuming date is available'
        );
        const result = { available: true, timestamp: Date.now() };
        this.cache.set(cacheKey, result);
        return true;
      }

      const data = (await response.json()) as FreeBusyResponse;
      const busySlots = data?.calendars?.[this.config.calendarId]?.busy ?? [];
      const isBusy = Array.isArray(busySlots) && busySlots.length > 0;
      const isAvailable = !isBusy;

      // Cache the result
      const result = { available: isAvailable, timestamp: Date.now() };
      this.cache.set(cacheKey, result);

      return isAvailable;
    } catch (error) {
      logger.warn(
        { error, date: dateUtc },
        'Error checking Google Calendar availability; assuming date is available'
      );
      const result = { available: true, timestamp: Date.now() };
      this.cache.set(cacheKey, result);
      return true;
    }
  }
}
