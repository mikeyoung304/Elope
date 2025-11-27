/**
 * Utility functions for AvailabilityRulesManager
 */

/**
 * Format time from 24-hour format (HH:MM) to 12-hour format (h:MM AM/PM)
 * @param time - Time in HH:MM format (e.g., "09:00", "17:30")
 * @returns Formatted time (e.g., "9:00 AM", "5:30 PM")
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Generate time options for dropdowns in 30-minute increments
 * @returns Array of time options in HH:MM format
 */
export function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hours = h.toString().padStart(2, '0');
      const minutes = m.toString().padStart(2, '0');
      times.push(`${hours}:${minutes}`);
    }
  }
  return times;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0];
}
