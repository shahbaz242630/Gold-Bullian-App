import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

import { AppConfig } from './configuration';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: NestConfigService<AppConfig>) {}

  get<T extends keyof AppConfig>(key: T): AppConfig[T] {
    return this.configService.getOrThrow<AppConfig[T]>(key);
  }

  getNumber(key: keyof AppConfig, defaultValue?: number): number {
    const value = this.configService.get<string | number>(key);
    if (value === undefined || value === null) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new Error(`Configuration value for ${String(key)} is missing`);
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Configuration value for ${String(key)} is not a number`);
    }

    return parsed;
  }


  getCorsOrigins(): string[] {
    const raw = this.get('CORS_ORIGINS');
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      return ['*'];
    }

    return raw;
  }
}

