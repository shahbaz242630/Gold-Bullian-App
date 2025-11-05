import { Expose, Type } from 'class-transformer';

import { WalletEntity } from '../entities/wallet.entity';

export class WalletSummaryDto {
  @Expose()
  userId!: string;

  @Expose()
  @Type(() => WalletEntity)
  wallets!: WalletEntity[];
}

