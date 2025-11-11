import { Module } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { SupabaseModule } from '../integrations/supabase/supabase.module';
import { StripeModule } from '../integrations/stripe/stripe.module';
import { AuthModule } from '../modules/auth/auth.module';
import { KycModule } from '../modules/kyc/kyc.module';
import { NomineesModule } from '../modules/nominees/nominees.module';
import { PricingModule } from '../modules/pricing/pricing.module';
import { TransactionsModule } from '../modules/transactions/transactions.module';
import { UsersModule } from '../modules/users/users.module';
import { WalletsModule } from '../modules/wallets/wallets.module';
import { GoldKittyModule } from '../modules/gold-kitty/gold-kitty.module';
import { RecurringPlansModule } from '../modules/recurring-plans/recurring-plans.module';
import { KidsWalletsModule } from '../modules/kids-wallets/kids-wallets.module';
import { PaymentModule } from '../modules/payments/payment.module';
import { StripePaymentsModule } from '../modules/stripe-payments/stripe-payments.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    SupabaseModule,
    StripeModule,
    UsersModule,
    WalletsModule,
    TransactionsModule,
    PricingModule,
    KycModule,
    NomineesModule,
    AuthModule,
    GoldKittyModule,
    RecurringPlansModule,
    KidsWalletsModule,
    PaymentModule,
    StripePaymentsModule,
    HealthModule,
  ],
})
export class AppModule {}



