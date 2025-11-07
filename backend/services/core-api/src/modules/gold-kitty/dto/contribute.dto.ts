import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class ContributeDto {
  @IsString()
  @IsNotEmpty()
  kittyId: string;

  @IsString()
  @IsNotEmpty()
  memberId: string; // GoldKittyMember ID

  @IsInt()
  @Min(1)
  roundNumber: number; // Which round this contribution is for
}
