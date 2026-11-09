import net from 'node:net';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '../env';

// Node tries each resolved IP for only 250 ms ("happy eyeballs"). From Bangladesh a TCP
// handshake to Neon us-east-2 takes ~300–450 ms, so every attempt timed out (ETIMEDOUT
// after ~750 ms). Must be set in code: NODE_OPTIONS in .env is read too late to apply.
// Harmless on Vercel/local Postgres where connects are fast.
net.setDefaultAutoSelectFamilyAttemptTimeout(2000);

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

