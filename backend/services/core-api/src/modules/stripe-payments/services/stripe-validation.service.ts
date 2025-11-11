import { BadRequestException, Injectable, Logger } from '@nestjs/common';

/**
 * Stripe Validation Service
 *
 * Validates business rules and constraints for Stripe operations
 *
 * Features:
 * - Amount validation
 * - Currency validation
 * - Email validation
 * - Payment method validation
 * - Business rule enforcement
 */
@Injectable()
export class StripeValidationService {
  private readonly logger = new Logger(StripeValidationService.name);

  // Stripe minimum charge amounts per currency (in smallest unit)
  private readonly MIN_AMOUNTS: Record<string, number> = {
    AED: 200, // 2.00 AED (fils)
    USD: 50, // 0.50 USD (cents)
    EUR: 50, // 0.50 EUR (cents)
    GBP: 30, // 0.30 GBP (pence)
  };

  // Maximum charge amount to prevent abuse (in AED)
  private readonly MAX_AMOUNT_AED = 1000000; // 1 million AED

  /**
   * Validate payment amount
   *
   * @param amount - Amount in smallest currency unit (e.g., fils for AED)
   * @param currency - Currency code (e.g., 'AED')
   * @throws BadRequestException if amount is invalid
   */
  validateAmount(amount: number, currency: string): void {
    // Check if amount is positive
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    // Check if amount is an integer
    if (!Number.isInteger(amount)) {
      throw new BadRequestException('Payment amount must be an integer (in smallest currency unit)');
    }

    // Check minimum amount
    const minAmount = this.MIN_AMOUNTS[currency.toUpperCase()] || 50;
    if (amount < minAmount) {
      const displayAmount = this.formatAmount(minAmount, currency);
      throw new BadRequestException(`Payment amount must be at least ${displayAmount}`);
    }

    // Check maximum amount (convert to AED for comparison)
    const maxAmountInSmallestUnit = this.MAX_AMOUNT_AED * 100; // AED to fils
    if (currency.toUpperCase() === 'AED' && amount > maxAmountInSmallestUnit) {
      throw new BadRequestException(
        `Payment amount cannot exceed ${this.formatAmount(maxAmountInSmallestUnit, 'AED')}`,
      );
    }

    this.logger.debug(`Validated amount: ${amount} ${currency}`);
  }

  /**
   * Validate currency code
   *
   * @param currency - Currency code
   * @throws BadRequestException if currency is not supported
   */
  validateCurrency(currency: string): void {
    const supportedCurrencies = ['AED', 'USD', 'EUR', 'GBP'];
    const upperCurrency = currency.toUpperCase();

    if (!supportedCurrencies.includes(upperCurrency)) {
      throw new BadRequestException(
        `Currency ${currency} is not supported. Supported currencies: ${supportedCurrencies.join(', ')}`,
      );
    }
  }

  /**
   * Validate email format
   *
   * @param email - Email address
   * @throws BadRequestException if email is invalid
   */
  validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email address format');
    }
  }

  /**
   * Validate payment metadata
   *
   * @param metadata - Metadata object
   * @throws BadRequestException if metadata is invalid
   */
  validateMetadata(metadata: Record<string, string | number | null>): void {
    // Stripe allows max 50 keys
    const keys = Object.keys(metadata);
    if (keys.length > 50) {
      throw new BadRequestException('Metadata cannot have more than 50 keys');
    }

    // Each key and value must be strings and less than 500 characters
    for (const [key, value] of Object.entries(metadata)) {
      if (key.length > 40) {
        throw new BadRequestException(`Metadata key "${key}" exceeds 40 characters`);
      }
      if (value !== null && String(value).length > 500) {
        throw new BadRequestException(`Metadata value for key "${key}" exceeds 500 characters`);
      }
    }
  }

  /**
   * Validate card details
   *
   * @param cardNumber - Card number
   * @param expMonth - Expiration month (1-12)
   * @param expYear - Expiration year (e.g., 2025)
   * @param cvc - CVC code
   * @throws BadRequestException if card details are invalid
   */
  validateCardDetails(cardNumber: string, expMonth: number, expYear: number, cvc: string): void {
    // Basic card number validation (Luhn algorithm would be better)
    if (!/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''))) {
      throw new BadRequestException('Invalid card number format');
    }

    // Validate expiration month
    if (expMonth < 1 || expMonth > 12) {
      throw new BadRequestException('Invalid expiration month (must be 1-12)');
    }

    // Validate expiration year
    const currentYear = new Date().getFullYear();
    if (expYear < currentYear || expYear > currentYear + 20) {
      throw new BadRequestException('Invalid expiration year');
    }

    // Validate CVC
    if (!/^\d{3,4}$/.test(cvc)) {
      throw new BadRequestException('Invalid CVC format (must be 3-4 digits)');
    }
  }

  /**
   * Validate webhook signature
   *
   * @param signature - Stripe signature from header
   * @param webhookSecret - Webhook secret
   * @throws BadRequestException if signature is missing or secret is not configured
   */
  validateWebhookSignature(signature: string | undefined, webhookSecret: string | null): void {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!webhookSecret) {
      this.logger.error('Webhook secret is not configured');
      throw new BadRequestException('Webhook verification not configured');
    }
  }

  /**
   * Format amount for display
   *
   * @param amount - Amount in smallest unit
   * @param currency - Currency code
   * @returns Formatted amount string
   */
  private formatAmount(amount: number, currency: string): string {
    const displayAmount = amount / 100; // Convert to major unit
    return `${displayAmount.toFixed(2)} ${currency.toUpperCase()}`;
  }

  /**
   * Check if amount is within safe range
   *
   * @param amount - Amount in AED
   * @returns true if amount is safe
   */
  isAmountSafe(amount: number): boolean {
    return amount > 0 && amount <= this.MAX_AMOUNT_AED;
  }
}
