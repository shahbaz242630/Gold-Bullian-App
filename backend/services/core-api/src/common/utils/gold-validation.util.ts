/**
 * Gold Validation Utilities
 *
 * Per PRD requirements:
 * - Gold can only be bought in multiples of 0.1 grams
 * - Valid: 0.1, 0.5, 1.0, 10, 0.2 grams
 * - Invalid: 0.11, 0.21, 0.15 grams
 */

export class GoldValidationUtil {
  /**
   * Validates that gold grams are in multiples of 0.1
   * @param grams - Amount of gold in grams
   * @returns true if valid, false otherwise
   */
  static isValidGoldAmount(grams: number): boolean {
    if (grams <= 0) {
      return false;
    }

    // Round to avoid floating point precision issues
    // Multiply by 10 to check if it's a whole number
    const multipliedBy10 = Math.round(grams * 10);
    const isMultipleOfPointOne = multipliedBy10 === grams * 10;

    return isMultipleOfPointOne;
  }

  /**
   * Rounds gold amount to nearest valid 0.1 gram multiple
   * @param grams - Amount of gold in grams
   * @returns Rounded amount
   */
  static roundToValidAmount(grams: number): number {
    return Math.round(grams * 10) / 10;
  }

  /**
   * Validates and throws error if gold amount is invalid
   * @param grams - Amount of gold in grams
   * @throws Error if invalid
   */
  static validateGoldAmount(grams: number): void {
    if (!this.isValidGoldAmount(grams)) {
      throw new Error(
        `Invalid gold amount: ${grams}g. Gold must be purchased in multiples of 0.1 grams (e.g., 0.1, 0.5, 1.0, 10.0). Not allowed: 0.11, 0.21, 0.15, etc.`
      );
    }
  }

  /**
   * Calculates gold grams from fiat amount at given price
   * Then validates and rounds to nearest 0.1g multiple
   * @param fiatAmount - Amount in fiat currency
   * @param pricePerGram - Price per gram in fiat
   * @returns Valid gold grams amount
   */
  static calculateValidGramsFromFiat(
    fiatAmount: number,
    pricePerGram: number
  ): number {
    const rawGrams = fiatAmount / pricePerGram;
    const rounded = this.roundToValidAmount(rawGrams);

    // Validate the rounded amount
    this.validateGoldAmount(rounded);

    return rounded;
  }

  /**
   * Gets suggested valid amounts near the requested amount
   * @param grams - Requested gold amount
   * @returns Array of valid amounts [lower, higher]
   */
  static getSuggestedValidAmounts(grams: number): [number, number] {
    const lower = Math.floor(grams * 10) / 10;
    const higher = Math.ceil(grams * 10) / 10;
    return [Math.max(0.1, lower), higher];
  }
}
