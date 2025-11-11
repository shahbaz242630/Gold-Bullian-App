import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  kittyId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string; // User to add as member

  @IsInt()
  @Min(1)
  allocationOrder!: number; // Order in which they receive the pot (1-N)
}
