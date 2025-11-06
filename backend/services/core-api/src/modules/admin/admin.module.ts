import { Module } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { PricingModule } from '../pricing/pricing.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminTransactionsService } from './services/admin-transactions.service';
import { AdminStatisticsService } from './services/admin-statistics.service';

@Module({
  imports: [PricingModule, TransactionsModule, UsersModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminUsersService,
    AdminTransactionsService,
    AdminStatisticsService,
    PrismaService,
  ],
})
export class AdminModule {}
