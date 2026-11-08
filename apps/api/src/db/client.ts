import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '../env';

// For Neon pooled connection with SSL
const queryClient = postgres(env.DATABASE_URL, {
  prepare: false, // Recommended for Neon pooler
  max: 10,
  // Opening a TLS connection to Neon (us-east-2) from Bangladesh takes ~3–4 s and
  // occasionally more (e.g. compute waking from auto-suspend), so 10 s was too tight.
  connect_timeout: 30,
  // Keep idle connections longer so most requests reuse one instead of paying
  // the multi-second handshake again every 20 s.
  idle_timeout: 300,
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;

