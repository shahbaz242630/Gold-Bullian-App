import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { AppConfigService } from '../../config/config.service';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor(private readonly configService: AppConfigService) {
    const url = this.configService.get('SUPABASE_URL');
    const serviceRoleKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}

