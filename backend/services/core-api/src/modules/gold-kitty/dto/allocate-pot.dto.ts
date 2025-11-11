import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class AllocatePotDto {
  @IsString()
  @IsNotEmpty()
  kittyId!: string;

  @IsString()
  @IsNotEmpty()
  memberId!: string; // Member to receive the pot

  @IsInt()
  @Min(1)
  roundNumber!: number; // Which round this allocation is for
}
