import { Injectable, BadRequestException } from '@nestjs/common';
import { PhysicalWithdrawalCoinSize, PhysicalWithdrawalDeliveryMethod } from '@prisma/client';

/**
 * Physical Withdrawal Validation Service
 *
 * Handles all business rule validations for physical gold withdrawals
 * Single Responsibility: Validate physical withdrawal operations
 */
@Injectable()
export class PhysicalWithdrawalValidationService {
  /**
   * Map coin size enum to grams
   */
  private readonly COIN_SIZE_TO_GRAMS: Record<PhysicalWithdrawalCoinSize, number> = {
    ONE_GRAM: 1,
    FIVE_GRAM: 5,
    TEN_GRAM: 10,
    TWENTY_GRAM: 20,
    FIFTY_GRAM: 50,
    HUNDRED_GRAM: 100,
  };

  /**
   * Calculate total grams from coin size and quantity
   */
  calculateTotalGrams(coinSize: PhysicalWithdrawalCoinSize, quantity: number): number {
    return this.COIN_SIZE_TO_GRAMS[coinSize] * quantity;
  }

  /**
   * Validate coin size and quantity
   */
  validateCoinSelection(coinSize: PhysicalWithdrawalCoinSize, quantity: number): void {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    if (quantity > 100) {
      throw new BadRequestException('Maximum quantity is 100 coins per withdrawal');
    }

    const totalGrams = this.calculateTotalGrams(coinSize, quantity);
    if (totalGrams < 1) {
      throw new BadRequestException('Minimum withdrawal is 1 gram');
    }

    if (totalGrams > 1000) {
      throw new BadRequestException('Maximum withdrawal is 1000 grams per transaction');
    }
  }

  /**
   * Validate delivery address is provided for home delivery
   */
  validateHomeDelivery(deliveryAddress?: any): void {
    if (!deliveryAddress) {
      throw new BadRequestException('Delivery address is required for home delivery');
    }

    const required = ['street', 'city', 'state', 'postalCode', 'country'];
    for (const field of required) {
      if (!deliveryAddress[field]) {
        throw new BadRequestException(`Delivery address ${field} is required`);
      }
    }
  }

  /**
   * Validate partner jeweller is selected for partner pickup
   */
  validatePartnerPickup(partnerJewellerId?: string, pickupLocation?: string): void {
    if (!partnerJewellerId) {
      throw new BadRequestException('Partner jeweller must be selected for partner pickup');
    }

    if (!pickupLocation) {
      throw new BadRequestException('Pickup location is required');
    }
  }

  /**
   * Validate vault pickup location
   */
  validateVaultPickup(pickupLocation?: string): void {
    if (!pickupLocation) {
      throw new BadRequestException('Vault pickup location is required');
    }
  }

  /**
   * Validate recipient details
   */
  validateRecipientDetails(recipientName: string, recipientPhone: string): void {
    if (!recipientName || recipientName.trim().length < 2) {
      throw new BadRequestException('Valid recipient name is required');
    }

    if (!recipientPhone || recipientPhone.length < 10) {
      throw new BadRequestException('Valid recipient phone number is required');
    }
  }

  /**
   * Validate delivery method specific requirements
   */
  validateDeliveryMethod(
    deliveryMethod: PhysicalWithdrawalDeliveryMethod,
    deliveryAddress?: any,
    partnerJewellerId?: string,
    pickupLocation?: string
  ): void {
    switch (deliveryMethod) {
      case PhysicalWithdrawalDeliveryMethod.HOME_DELIVERY:
        this.validateHomeDelivery(deliveryAddress);
        break;

      case PhysicalWithdrawalDeliveryMethod.PARTNER_PICKUP:
        this.validatePartnerPickup(partnerJewellerId, pickupLocation);
        break;

      case PhysicalWithdrawalDeliveryMethod.VAULT_PICKUP:
        this.validateVaultPickup(pickupLocation);
        break;

      default:
        throw new BadRequestException('Invalid delivery method');
    }
  }

  /**
   * Get coin size display name
   */
  getCoinSizeDisplayName(coinSize: PhysicalWithdrawalCoinSize): string {
    return `${this.COIN_SIZE_TO_GRAMS[coinSize]}g Gold Coin`;
  }
}
