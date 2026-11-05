import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BETTER_AUTH_SECRET: z.string().min(16, 'BETTER_AUTH_SECRET must be at least 16 chars'),
  BETTER_AUTH_URL: z.string().default('http://localhost:3000'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  // In development, warn rather than crash immediately to allow health check before DB setup
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      PORT: Number(process.env.PORT) || 3000,
      DATABASE_URL: process.env.DATABASE_URL || '',
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'dev_secret_key_32_characters_minimum',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
      WEB_ORIGIN: process.env.WEB_ORIGIN || 'http://localhost:5173',
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    };

