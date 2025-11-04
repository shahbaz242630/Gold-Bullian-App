import { z } from 'zod';

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default('bulliun-platform'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type BaseConfig = z.infer<typeof baseSchema>;

export const loadBaseConfig = (env: NodeJS.ProcessEnv = process.env): BaseConfig => {
  const result = baseSchema.safeParse(env);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${result.error.errors
        .map((error) => `${error.path.join('.')}: ${error.message}`)
        .join('\n')}`,
    );
  }

  return result.data;
};

export const baseConfig = loadBaseConfig();
