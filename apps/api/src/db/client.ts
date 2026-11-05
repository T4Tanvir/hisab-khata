import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '../env';

// For Neon pooled connection with SSL
const queryClient = postgres(env.DATABASE_URL, {
  prepare: false, // Recommended for Neon pooler
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;

