import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';

/**
 * Payment Module - Ready for WadzPay Integration
 *
 * This module will handle all payment processing through WadzPay.
 * Export PaymentService and import this module wherever payments are needed.
 *
 * Integration Steps:
 * 1. Add WadzPay credentials to .env (WADZPAY_API_KEY, WADZPAY_SECRET, etc.)
 * 2. Install WadzPay SDK: npm install @wadzpay/node-sdk (if available)
 * 3. Implement the TODO sections in payment.service.ts
 * 4. Test with WadzPay sandbox environment first
 * 5. Update to production credentials when ready
 */

@Module({
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
