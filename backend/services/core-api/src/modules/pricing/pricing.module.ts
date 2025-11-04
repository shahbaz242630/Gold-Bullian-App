import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { PricingService } from './pricing.service';

@Module({
  imports: [DatabaseModule],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}

