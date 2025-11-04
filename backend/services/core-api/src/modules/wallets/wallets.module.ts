import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { WalletsService } from './wallets.service';

@Module({
  imports: [DatabaseModule],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}

