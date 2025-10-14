/**
 * Payments domain port
 */

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export interface PaymentProvider {
  createCheckoutSession(input: {
    amountCents: number;
    email: string;
    metadata: Record<string, string>;
  }): Promise<CheckoutSession>;
  verifyWebhook(payload: string, signature: string): Promise<unknown>;
}
