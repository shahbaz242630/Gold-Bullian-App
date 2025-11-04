import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 chars.'),
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((value) => value?.split(',').map((origin) => origin.trim())),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid Supabase Postgres URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type AppConfig = z.infer<typeof envSchema>;

export default registerAs('app', () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Configuration validation error: ${parsed.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ')}`,
    );
  }

  return parsed.data;
});
