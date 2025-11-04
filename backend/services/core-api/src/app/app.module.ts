import { Module } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';
import { SupabaseModule } from '../integrations/supabase/supabase.module';

import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule, SupabaseModule, HealthModule],
})
export class AppModule {}

