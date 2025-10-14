/**
 * Stripe payment adapter
 */

import type { PaymentProvider, CheckoutSession } from '../domains/payments/port';

export class StripeAdapter implements PaymentProvider {
  constructor(private readonly _secretKey: string) {
    // TODO: Initialize Stripe SDK
  }

  async createCheckoutSession(_input: {
    amountCents: number;
    email: string;
    metadata: Record<string, string>;
  }): Promise<CheckoutSession> {
    // TODO: Implement Stripe checkout session creation
    throw new Error('Not implemented - Stripe checkout session');
  }

  async verifyWebhook(_payload: string, _signature: string): Promise<unknown> {
    // TODO: Implement Stripe webhook verification
    throw new Error('Not implemented - Stripe webhook verification');
  }
}
