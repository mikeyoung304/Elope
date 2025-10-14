/**
 * Postmark email adapter
 */

import type { EmailProvider } from '../domains/notifications/port';

export class PostmarkAdapter implements EmailProvider {
  constructor(
    private readonly _serverToken: string,
    private readonly _fromEmail: string
  ) {
    // TODO: Initialize Postmark client
  }

  async sendEmail(_input: { to: string; subject: string; html: string }): Promise<void> {
    // TODO: Implement Postmark email sending
    throw new Error('Not implemented - Postmark email sending');
  }
}
