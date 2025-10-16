/**
 * Stripe payment adapter
 */

import Stripe from 'stripe';
import type { PaymentProvider, CheckoutSession } from '../domains/payments/port';

export interface StripeAdapterOptions {
  secretKey: string;
  webhookSecret: string;
  successUrl: string;
  cancelUrl: string;
}

export class StripePaymentAdapter implements PaymentProvider {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;

  constructor(options: StripeAdapterOptions) {
    this.stripe = new Stripe(options.secretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
    this.webhookSecret = options.webhookSecret;
    this.successUrl = options.successUrl;
    this.cancelUrl = options.cancelUrl;
  }

  async createCheckoutSession(input: {
    amountCents: number;
    email: string;
    metadata: Record<string, string>;
  }): Promise<CheckoutSession> {
    // Create Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: input.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: input.amountCents,
            product_data: {
              name: 'Wedding Package',
              description: 'Elopement/Micro-Wedding Package',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${this.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: this.cancelUrl,
      metadata: input.metadata,
    });

    if (!session.url) {
      throw new Error('Stripe session created but no URL returned');
    }

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<Stripe.Event> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      return event;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Webhook signature verification failed: ${message}`);
    }
  }

  /**
   * Refund a payment (placeholder for future implementation)
   */
  async refund(_sessionOrPaymentId: string): Promise<void> {
    // TODO: Implement refund logic
    throw new Error('Refund not yet implemented');
  }
}
