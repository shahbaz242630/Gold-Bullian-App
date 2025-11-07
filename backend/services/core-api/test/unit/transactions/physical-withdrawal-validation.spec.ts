import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicalWithdrawalValidationService } from '../../../src/modules/transactions/services/physical-withdrawal-validation.service';

describe('PhysicalWithdrawalValidationService', () => {
  let service: PhysicalWithdrawalValidationService;

  beforeEach(() => {
    service = new PhysicalWithdrawalValidationService();
  });

  describe('calculateTotalGrams', () => {
    it('should calculate correct grams for different coin sizes', () => {
      expect(service.calculateTotalGrams('ONE_GRAM' as any, 5)).toBe(5);
      expect(service.calculateTotalGrams('FIVE_GRAM' as any, 2)).toBe(10);
      expect(service.calculateTotalGrams('TEN_GRAM' as any, 3)).toBe(30);
      expect(service.calculateTotalGrams('TWENTY_GRAM' as any, 2)).toBe(40);
      expect(service.calculateTotalGrams('FIFTY_GRAM' as any, 2)).toBe(100);
      expect(service.calculateTotalGrams('HUNDRED_GRAM' as any, 1)).toBe(100);
    });
  });

  describe('validateCoinSelection', () => {
    it('should accept valid selections', () => {
      expect(() => {
        service.validateCoinSelection('TEN_GRAM' as any, 5);
      }).not.toThrow();
    });

    it('should reject quantity below minimum', () => {
      expect(() => {
        service.validateCoinSelection('TEN_GRAM' as any, 0);
      }).toThrow('Quantity must be at least 1');
    });

    it('should reject quantity above maximum', () => {
      expect(() => {
        service.validateCoinSelection('TEN_GRAM' as any, 150);
      }).toThrow('Maximum quantity is 100 coins per withdrawal');
    });

    it('should reject total grams above maximum', () => {
      expect(() => {
        service.validateCoinSelection('HUNDRED_GRAM' as any, 15);
      }).toThrow('Maximum withdrawal is 1000 grams per transaction');
    });
  });

  describe('validateHomeDelivery', () => {
    it('should accept complete delivery address', () => {
      const address = {
        street: '123 Main St',
        city: 'Dubai',
        state: 'Dubai',
        postalCode: '12345',
        country: 'UAE',
      };

      expect(() => {
        service.validateHomeDelivery(address);
      }).not.toThrow();
    });

    it('should reject missing address', () => {
      expect(() => {
        service.validateHomeDelivery(undefined);
      }).toThrow('Delivery address is required for home delivery');
    });

    it('should reject incomplete address', () => {
      const address = {
        street: '123 Main St',
        // Missing other fields
      };

      expect(() => {
        service.validateHomeDelivery(address);
      }).toThrow('Delivery address');
    });
  });

  describe('validatePartnerPickup', () => {
    it('should accept valid partner selection', () => {
      expect(() => {
        service.validatePartnerPickup('partner-123', 'Dubai Mall');
      }).not.toThrow();
    });

    it('should reject missing partner', () => {
      expect(() => {
        service.validatePartnerPickup(undefined, 'Dubai Mall');
      }).toThrow('Partner jeweller must be selected');
    });

    it('should reject missing location', () => {
      expect(() => {
        service.validatePartnerPickup('partner-123', undefined);
      }).toThrow('Pickup location is required');
    });
  });

  describe('validateRecipientDetails', () => {
    it('should accept valid recipient details', () => {
      expect(() => {
        service.validateRecipientDetails('John Doe', '+971501234567');
      }).not.toThrow();
    });

    it('should reject invalid name', () => {
      expect(() => {
        service.validateRecipientDetails('J', '+971501234567');
      }).toThrow('Valid recipient name is required');
    });

    it('should reject invalid phone', () => {
      expect(() => {
        service.validateRecipientDetails('John Doe', '123');
      }).toThrow('Valid recipient phone number is required');
    });
  });

  describe('getCoinSizeDisplayName', () => {
    it('should return correct display names', () => {
      expect(service.getCoinSizeDisplayName('ONE_GRAM' as any)).toBe('1g Gold Coin');
      expect(service.getCoinSizeDisplayName('FIVE_GRAM' as any)).toBe('5g Gold Coin');
      expect(service.getCoinSizeDisplayName('TEN_GRAM' as any)).toBe('10g Gold Coin');
      expect(service.getCoinSizeDisplayName('HUNDRED_GRAM' as any)).toBe('100g Gold Coin');
    });
  });
});
