/**
 * Google Calendar adapter
 */

import type { CalendarProvider } from '../domains/availability/port';

export class GoogleCalendarAdapter implements CalendarProvider {
  constructor(
    private readonly calendarId: string,
    private readonly serviceAccountJson: string
  ) {
    // TODO: Initialize Google Calendar API client
  }

  async isDateAvailable(date: string): Promise<boolean> {
    // TODO: Implement Google Calendar availability check
    throw new Error('Not implemented - Google Calendar availability check');
  }
}
