import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { env } from '../env';
import { seedNewUserData } from '../db/seed';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  trustedOrigins: async (request) => {
    const list = [
      env.WEB_ORIGIN,
      'http://localhost:*',
      'http://127.0.0.1:*',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:3000',
    ];
    const origin = request?.headers?.get('origin');
    if (origin) list.push(origin);
    const referer = request?.headers?.get('referer');
    if (referer) {
      try {
        list.push(new URL(referer).origin);
      } catch {}
    }
    return list;
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          try {
            await seedNewUserData(createdUser.id);
          } catch (err) {
            console.error('Failed to seed default categories and wallet for new user:', err);
          }
        },
      },
    },
  },
});

export type Auth = typeof auth;

