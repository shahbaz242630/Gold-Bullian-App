import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferToKidDto {
  @IsString()
  @IsNotEmpty()
  parentUserId: string;

  @IsString()
  @IsNotEmpty()
  kidUserId: string;

  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.1) // Minimum 0.1 grams (following 0.1gm validation)
  @Type(() => Number)
  goldGrams: number;

  @IsString()
  @IsOptional()
  note?: string; // Optional note for the transfer
}
