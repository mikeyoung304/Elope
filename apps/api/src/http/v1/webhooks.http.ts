/**
 * Webhooks HTTP controller
 * NOTE: This route requires raw body parsing (not JSON)
 */

export class WebhooksController {
  async handleStripeWebhook(_rawBody: string, _signature: string): Promise<void> {
    // TODO: Verify webhook signature and process event
    // This will need raw body parser configured in express
    console.log('Webhook received (not yet implemented)');
  }
}
