import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Length, Min, IsEnum, IsInt, IsNotEmpty, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { PhysicalWithdrawalCoinSize, PhysicalWithdrawalDeliveryMethod } from '@prisma/client';

/**
 * Delivery Address DTO
 */
export class DeliveryAddressDto {
  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  postalCode!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsOptional()
  landmark?: string;
}

/**
 * Enhanced Physical Withdrawal DTO
 * Includes coin size selection, delivery options, and recipient details
 */
export class WithdrawPhysicalDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  // ==================== Coin Selection ====================

  @IsEnum(PhysicalWithdrawalCoinSize)
  coinSize!: PhysicalWithdrawalCoinSize; // ONE_GRAM, FIVE_GRAM, TEN_GRAM, etc.

  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  quantity!: number; // Number of coins

  // goldGrams is calculated as: coinSize * quantity

  // ==================== Delivery Method ====================

  @IsEnum(PhysicalWithdrawalDeliveryMethod)
  deliveryMethod!: PhysicalWithdrawalDeliveryMethod; // HOME_DELIVERY, PARTNER_PICKUP, VAULT_PICKUP

  // ==================== Recipient Details ====================

  @IsString()
  @IsNotEmpty()
  recipientName!: string;

  @IsString()
  @IsNotEmpty()
  recipientPhone!: string;

  // ==================== Home Delivery Fields (conditional) ====================

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  // ==================== Partner/Vault Pickup Fields (conditional) ====================

  @IsOptional()
  @IsString()
  partnerJewellerId?: string; // For PARTNER_PICKUP

  @IsOptional()
  @IsString()
  pickupLocation?: string; // For VAULT_PICKUP or PARTNER_PICKUP

  // ==================== Optional Fields ====================

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  feeAmount?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency: string = 'AED';

  @IsOptional()
  metadata?: Record<string, unknown>;
}
