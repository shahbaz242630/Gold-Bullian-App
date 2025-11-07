import { Module } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { SupabaseModule } from '../integrations/supabase/supabase.module';
import { AdminModule } from '../modules/admin/admin.module';
import { AuthModule } from '../modules/auth/auth.module';
import { KycModule } from '../modules/kyc/kyc.module';
import { NomineesModule } from '../modules/nominees/nominees.module';
import { PricingModule } from '../modules/pricing/pricing.module';
import { TransactionsModule } from '../modules/transactions/transactions.module';
import { UsersModule } from '../modules/users/users.module';
import { WalletsModule } from '../modules/wallets/wallets.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    SupabaseModule,
    UsersModule,
    WalletsModule,
    TransactionsModule,
    PricingModule,
    KycModule,
    NomineesModule,
    AuthModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}



