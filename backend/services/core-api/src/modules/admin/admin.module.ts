import { Module } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { PricingModule } from '../pricing/pricing.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PricingModule, TransactionsModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
