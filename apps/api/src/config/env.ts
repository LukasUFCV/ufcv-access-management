import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const currentDir = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(currentDir, '../../../../.env') });
config({ path: resolve(currentDir, '../../../../prisma/.env'), override: false });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url().default('http://localhost:4000'),
  WEB_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(12),
  JWT_EXPIRES_IN: z.string().default('8h'),
  COOKIE_NAME: z.string().default('ufcv_access_token'),
  CACHE_DEFAULT_TTL_SECONDS: z.coerce.number().default(300),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  MOCK_CONNECTORS_ENABLED: z
    .string()
    .default('true')
    .transform((value) => value === 'true'),
  MICROSOFT_TENANT_ID: z.string().optional().default(''),
  MICROSOFT_CLIENT_ID: z.string().optional().default(''),
  MICROSOFT_CLIENT_SECRET: z.string().optional().default(''),
  GRAPH_BASE_URL: z.string().default('https://graph.microsoft.com'),
  DIRECTORY_SYNC_STRATEGY: z.string().default('mock'),
});

export const env = envSchema.parse(process.env);
