import { describe, it, expect } from 'vitest';
import { GoldValidationUtil } from './gold-validation.util';

describe('GoldValidationUtil', () => {
  describe('isValidGoldAmount', () => {
    it('should accept valid multiples of 0.1 grams', () => {
      expect(GoldValidationUtil.isValidGoldAmount(0.1)).toBe(true);
      expect(GoldValidationUtil.isValidGoldAmount(0.2)).toBe(true);
      expect(GoldValidationUtil.isValidGoldAmount(0.5)).toBe(true);
      expect(GoldValidationUtil.isValidGoldAmount(1.0)).toBe(true);
      expect(GoldValidationUtil.isValidGoldAmount(1.5)).toBe(true);
      expect(GoldValidationUtil.isValidGoldAmount(10.0)).toBe(true);
      expect(GoldValidationUtil.isValidGoldAmount(100.0)).toBe(true);
    });

    it('should reject invalid amounts (not multiples of 0.1)', () => {
      expect(GoldValidationUtil.isValidGoldAmount(0.11)).toBe(false);
      expect(GoldValidationUtil.isValidGoldAmount(0.21)).toBe(false);
      expect(GoldValidationUtil.isValidGoldAmount(0.15)).toBe(false);
      expect(GoldValidationUtil.isValidGoldAmount(1.23)).toBe(false);
      expect(GoldValidationUtil.isValidGoldAmount(10.05)).toBe(false);
    });

    it('should reject zero and negative amounts', () => {
      expect(GoldValidationUtil.isValidGoldAmount(0)).toBe(false);
      expect(GoldValidationUtil.isValidGoldAmount(-0.1)).toBe(false);
      expect(GoldValidationUtil.isValidGoldAmount(-1.0)).toBe(false);
    });
  });

  describe('roundToValidAmount', () => {
    it('should round to nearest 0.1 gram', () => {
      expect(GoldValidationUtil.roundToValidAmount(0.14)).toBe(0.1);
      expect(GoldValidationUtil.roundToValidAmount(0.16)).toBe(0.2);
      expect(GoldValidationUtil.roundToValidAmount(0.25)).toBe(0.3);
      expect(GoldValidationUtil.roundToValidAmount(1.23)).toBe(1.2);
      expect(GoldValidationUtil.roundToValidAmount(1.27)).toBe(1.3);
    });
  });

  describe('validateGoldAmount', () => {
    it('should not throw for valid amounts', () => {
      expect(() => GoldValidationUtil.validateGoldAmount(0.1)).not.toThrow();
      expect(() => GoldValidationUtil.validateGoldAmount(1.0)).not.toThrow();
      expect(() => GoldValidationUtil.validateGoldAmount(10.5)).not.toThrow();
    });

    it('should throw for invalid amounts', () => {
      expect(() => GoldValidationUtil.validateGoldAmount(0.11)).toThrow(
        /Invalid gold amount.*multiples of 0.1/
      );
      expect(() => GoldValidationUtil.validateGoldAmount(0.21)).toThrow();
      expect(() => GoldValidationUtil.validateGoldAmount(1.15)).toThrow();
    });
  });

  describe('calculateValidGramsFromFiat', () => {
    it('should calculate and round to valid amount', () => {
      // 100 AED at 250 AED/g = 0.4g (valid)
      expect(
        GoldValidationUtil.calculateValidGramsFromFiat(100, 250)
      ).toBe(0.4);

      // 123 AED at 250 AED/g = 0.492g -> rounds to 0.5g
      expect(
        GoldValidationUtil.calculateValidGramsFromFiat(123, 250)
      ).toBe(0.5);

      // 1000 AED at 250 AED/g = 4.0g (valid)
      expect(
        GoldValidationUtil.calculateValidGramsFromFiat(1000, 250)
      ).toBe(4.0);
    });
  });

  describe('getSuggestedValidAmounts', () => {
    it('should suggest lower and higher valid amounts', () => {
      expect(GoldValidationUtil.getSuggestedValidAmounts(0.14)).toEqual([
        0.1, 0.2,
      ]);
      expect(GoldValidationUtil.getSuggestedValidAmounts(0.25)).toEqual([
        0.2, 0.3,
      ]);
      expect(GoldValidationUtil.getSuggestedValidAmounts(1.23)).toEqual([
        1.2, 1.3,
      ]);
    });

    it('should not suggest amounts below 0.1', () => {
      expect(GoldValidationUtil.getSuggestedValidAmounts(0.05)).toEqual([
        0.1, 0.1,
      ]);
    });
  });
});
