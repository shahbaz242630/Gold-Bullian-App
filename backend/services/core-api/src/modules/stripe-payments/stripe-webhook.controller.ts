import { Controller, Post, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { StripePaymentsService } from './services/stripe-payments.service';

/**
 * Stripe Webhook Controller
 *
 * Handles incoming Stripe webhook events
 *
 * IMPORTANT:
 * - This endpoint must receive raw body (not parsed JSON)
 * - Signature verification requires raw body
 * - No auth guard (verified by Stripe signature)
 * - Must respond quickly (< 5 seconds)
 *
 * Endpoint:
 * - POST /webhooks/stripe - Receive webhook events
 */
@Controller('webhooks')
export class StripeWebhookController {
  constructor(private readonly stripePayments: StripePaymentsService) {}

  /**
   * POST /webhooks/stripe
   * Receive and process Stripe webhook events
   *
   * IMPORTANT: This endpoint requires raw body handling
   * Configure in main.ts:
   * ```typescript
   * app.useBodyParser('json', { rawBody: true });
   * ```
   */
  @Post('stripe')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // Get raw body (required for signature verification)
    const rawBody = req.rawBody || Buffer.from('');

    try {
      const result = await this.stripePayments.processWebhook(rawBody, signature);

      return {
        received: true,
        processed: result.processed,
        message: result.message,
      };
    } catch (error) {
      // Return 400 to tell Stripe the webhook failed
      throw error;
    }
  }
}
