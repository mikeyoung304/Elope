/**
 * Notifications domain port
 */

export interface EmailProvider {
  sendEmail(input: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void>;
}

export interface NotificationService {
  sendBookingConfirmation(bookingId: string, email: string): Promise<void>;
}
