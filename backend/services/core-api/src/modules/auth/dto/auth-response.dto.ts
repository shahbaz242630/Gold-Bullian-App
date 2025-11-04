import { Expose, Type } from 'class-transformer';

import { UserEntity } from '../../users/entities/user.entity';

export class AuthResponseDto {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;

  @Expose()
  expiresIn!: number;

  @Expose()
  tokenType!: string;

  @Expose()
  @Type(() => UserEntity)
  user!: UserEntity;
}

