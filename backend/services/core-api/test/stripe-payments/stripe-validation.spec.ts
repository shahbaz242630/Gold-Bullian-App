import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { StripeValidationService } from '../../src/modules/stripe-payments/services/stripe-validation.service';

/**
 * Stripe Validation Service Unit Tests
 *
 * Tests business rule validation logic
 */
describe('StripeValidationService', () => {
  let service: StripeValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeValidationService],
    }).compile();

    service = module.get<StripeValidationService>(StripeValidationService);
  });

  describe('validateAmount', () => {
    it('should accept valid amounts', () => {
      expect(() => service.validateAmount(200, 'AED')).not.toThrow();
      expect(() => service.validateAmount(1000, 'AED')).not.toThrow();
    });

    it('should reject zero or negative amounts', () => {
      expect(() => service.validateAmount(0, 'AED')).toThrow('Payment amount must be greater than zero');
      expect(() => service.validateAmount(-100, 'AED')).toThrow('Payment amount must be greater than zero');
    });

    it('should reject amounts below minimum', () => {
      expect(() => service.validateAmount(100, 'AED')).toThrow('Payment amount must be at least');
    });

    it('should reject non-integer amounts', () => {
      expect(() => service.validateAmount(100.5, 'AED')).toThrow('Payment amount must be an integer');
    });
  });

  describe('validateCurrency', () => {
    it('should accept supported currencies', () => {
      expect(() => service.validateCurrency('AED')).not.toThrow();
      expect(() => service.validateCurrency('USD')).not.toThrow();
      expect(() => service.validateCurrency('eur')).not.toThrow(); // case insensitive
    });

    it('should reject unsupported currencies', () => {
      expect(() => service.validateCurrency('XYZ')).toThrow('Currency XYZ is not supported');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email formats', () => {
      expect(() => service.validateEmail('user@example.com')).not.toThrow();
      expect(() => service.validateEmail('test.user+tag@domain.co.uk')).not.toThrow();
    });

    it('should reject invalid email formats', () => {
      expect(() => service.validateEmail('invalid')).toThrow('Invalid email address format');
      expect(() => service.validateEmail('no@domain')).toThrow('Invalid email address format');
      expect(() => service.validateEmail('@nodomain.com')).toThrow('Invalid email address format');
    });
  });

  describe('validateMetadata', () => {
    it('should accept valid metadata', () => {
      const metadata = { userId: '123', transactionId: '456' };
      expect(() => service.validateMetadata(metadata)).not.toThrow();
    });

    it('should reject metadata with too many keys', () => {
      const metadata = Object.fromEntries(Array.from({ length: 51 }, (_, i) => [`key${i}`, `value${i}`]));
      expect(() => service.validateMetadata(metadata)).toThrow('Metadata cannot have more than 50 keys');
    });

    it('should reject metadata with keys that are too long', () => {
      const metadata = { [Array(41).fill('a').join('')]: 'value' };
      expect(() => service.validateMetadata(metadata)).toThrow('exceeds 40 characters');
    });

    it('should reject metadata with values that are too long', () => {
      const metadata = { key: Array(501).fill('a').join('') };
      expect(() => service.validateMetadata(metadata)).toThrow('exceeds 500 characters');
    });
  });

  describe('isAmountSafe', () => {
    it('should return true for safe amounts', () => {
      expect(service.isAmountSafe(100)).toBe(true);
      expect(service.isAmountSafe(999999)).toBe(true);
    });

    it('should return false for unsafe amounts', () => {
      expect(service.isAmountSafe(0)).toBe(false);
      expect(service.isAmountSafe(-100)).toBe(false);
      expect(service.isAmountSafe(1000001)).toBe(false);
    });
  });
});
