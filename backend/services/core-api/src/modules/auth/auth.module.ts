import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { SupabaseModule } from '../../integrations/supabase/supabase.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [DatabaseModule, SupabaseModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

