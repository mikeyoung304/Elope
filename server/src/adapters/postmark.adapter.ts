/**
 * Postmark email adapter
 */

import * as path from 'path';
import * as fs from 'fs';
import type { EmailProvider } from '../lib/ports';
import { logger } from '../lib/core/logger';

export class PostmarkMailAdapter implements EmailProvider {
  constructor(private cfg: { serverToken?: string; fromEmail: string }) {}

  async sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.cfg.serverToken) {
      // file sink fallback
      const dir = path.join(process.cwd(), 'tmp', 'emails');
      await fs.promises.mkdir(dir, { recursive: true });
      const fname = `${Date.now()}_${input.to.replace(/[^a-z0-9@._-]/gi, '_')}.eml`;
      const raw = `From: ${this.cfg.fromEmail}\nTo: ${input.to}\nSubject: ${input.subject}\n\n${input.html}`;
      await fs.promises.writeFile(path.join(dir, fname), raw, 'utf8');
      logger.info(
        { to: input.to, file: path.join('tmp', 'emails', fname) },
        'Email written to file sink'
      );
      return;
    }

    // Real Postmark send
    const resp = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.cfg.serverToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: this.cfg.fromEmail,
        To: input.to,
        Subject: input.subject,
        HtmlBody: input.html,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      logger.error({ status: resp.status, text }, 'Postmark send failed');
      throw new Error('MailSendFailed');
    }
  }

  async sendBookingConfirm(
    to: string,
    payload: {
      eventDate: string;
      packageTitle: string;
      totalCents: number;
      addOnTitles: string[];
    }
  ): Promise<void> {
    const subject = `Your micro-wedding is booked for ${payload.eventDate}`;
    const body = [
      `Hi,`,
      ``,
      `You're confirmed!`,
      `Date: ${payload.eventDate}`,
      `Package: ${payload.packageTitle}`,
      `Add-ons: ${payload.addOnTitles.join(', ') || 'None'}`,
      `Total: ${(payload.totalCents / 100).toFixed(2)}`,
      ``,
      `We'll be in touch with details.`,
    ].join('\n');

    if (!this.cfg.serverToken) {
      // file sink fallback
      const dir = path.join(process.cwd(), 'tmp', 'emails');
      await fs.promises.mkdir(dir, { recursive: true });
      const fname = `${Date.now()}_${to.replace(/[^a-z0-9@._-]/gi, '_')}.eml`;
      const raw = `From: ${this.cfg.fromEmail}\nTo: ${to}\nSubject: ${subject}\n\n${body}`;
      await fs.promises.writeFile(path.join(dir, fname), raw, 'utf8');
      logger.info(
        { to, file: path.join('tmp', 'emails', fname) },
        'Email written to file sink'
      );
      return;
    }

    // Real Postmark send
    const resp = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.cfg.serverToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: this.cfg.fromEmail,
        To: to,
        Subject: subject,
        TextBody: body,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      logger.error({ status: resp.status, text }, 'Postmark send failed');
      throw new Error('MailSendFailed');
    }
  }
}
