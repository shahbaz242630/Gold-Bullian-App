import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import Stripe from 'stripe';

/**
 * Stripe Error Handler Service
 *
 * Centralized error handling for all Stripe operations
 *
 * Features:
 * - Converts Stripe errors to NestJS exceptions
 * - Provides user-friendly error messages
 * - Logs detailed error information
 * - Handles all Stripe error types
 *
 * Stripe Error Types:
 * - StripeCardError: Card declined, insufficient funds, etc.
 * - StripeInvalidRequestError: Invalid parameters
 * - StripeAPIError: Stripe API issues
 * - StripeConnectionError: Network issues
 * - StripeAuthenticationError: API key issues
 * - StripeRateLimitError: Too many requests
 */
@Injectable()
export class StripeErrorHandlerService {
  private readonly logger = new Logger(StripeErrorHandlerService.name);

  /**
   * Handle and transform Stripe errors into NestJS exceptions
   *
   * @param error - The error to handle
   * @param context - Additional context for logging
   * @throws NestJS exception with appropriate status code
   */
  handleError(error: unknown, context?: string): never {
    const contextMsg = context ? `[${context}] ` : '';

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      this.logger.error(
        `${contextMsg}Stripe error: ${error.type} - ${error.message}`,
        error.stack,
      );

      switch (error.type) {
        case 'StripeCardError':
          throw new BadRequestException({
            message: 'Payment failed',
            error: error.message || 'Your card was declined',
            code: error.code,
            decline_code: (error as Stripe.errors.StripeCardError).decline_code,
          });

        case 'StripeInvalidRequestError':
          throw new BadRequestException({
            message: 'Invalid payment request',
            error: error.message || 'The payment request was invalid',
            param: (error as Stripe.errors.StripeInvalidRequestError).param,
          });

        case 'StripeAuthenticationError':
          this.logger.error('Stripe API authentication failed - check API keys');
          throw new UnauthorizedException({
            message: 'Payment service authentication failed',
            error: 'Unable to process payment at this time',
          });

        case 'StripeRateLimitError':
          this.logger.warn('Stripe rate limit exceeded');
          throw new BadRequestException({
            message: 'Too many requests',
            error: 'Please try again in a few moments',
          });

        case 'StripeConnectionError':
          this.logger.error('Failed to connect to Stripe API');
          throw new InternalServerErrorException({
            message: 'Payment service connection failed',
            error: 'Unable to connect to payment service',
          });

        case 'StripeAPIError':
        default:
          this.logger.error('Stripe API error', error.stack);
          throw new InternalServerErrorException({
            message: 'Payment processing failed',
            error: 'An error occurred while processing your payment',
          });
      }
    }

    // Handle generic errors
    this.logger.error(`${contextMsg}Unexpected error:`, error);
    throw new InternalServerErrorException({
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  /**
   * Check if error is a Stripe error
   *
   * @param error - The error to check
   * @returns true if error is a Stripe error
   */
  isStripeError(error: unknown): error is Stripe.errors.StripeError {
    return error instanceof Stripe.errors.StripeError;
  }

  /**
   * Get user-friendly error message from Stripe error
   *
   * @param error - Stripe error
   * @returns User-friendly error message
   */
  getUserFriendlyMessage(error: Stripe.errors.StripeError): string {
    switch (error.type) {
      case 'StripeCardError':
        return error.message || 'Your card was declined. Please try another payment method.';
      case 'StripeInvalidRequestError':
        return 'Invalid payment information. Please check your details and try again.';
      case 'StripeAuthenticationError':
        return 'Payment service is temporarily unavailable. Please try again later.';
      case 'StripeRateLimitError':
        return 'Too many payment attempts. Please wait a moment and try again.';
      case 'StripeConnectionError':
        return 'Unable to connect to payment service. Please check your internet connection.';
      default:
        return 'Payment processing failed. Please try again or contact support.';
    }
  }
}
