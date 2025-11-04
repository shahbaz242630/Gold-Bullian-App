import { IsEmail, IsString, Length } from 'class-validator';

export class LoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(12, 128)
  password!: string;
}

