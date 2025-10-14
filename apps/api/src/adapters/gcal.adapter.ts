/**
 * Google Calendar adapter
 */

import type { CalendarProvider } from '../domains/availability/port';

export class GoogleCalendarAdapter implements CalendarProvider {
  constructor(
    private readonly _calendarId: string,
    private readonly _serviceAccountJson: string
  ) {
    // TODO: Initialize Google Calendar API client
  }

  async isDateAvailable(_date: string): Promise<boolean> {
    // TODO: Implement Google Calendar availability check
    throw new Error('Not implemented - Google Calendar availability check');
  }
}
