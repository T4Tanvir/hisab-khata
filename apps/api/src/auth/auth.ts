import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { env } from '../env';
import { isAllowedOrigin } from '../lib/origins';
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
  advanced: {
    ipAddress: {
      // Client IP for rate limiting. Vercel sets these itself (clients can't spoof them);
      // without this every user would share one rate-limit bucket.
      ipAddressHeaders: ['x-vercel-forwarded-for', 'x-real-ip', 'x-forwarded-for'],
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  // Only the configured web origin (and localhost in development) is trusted.
  // Never trust the request's own Origin/Referer blindly — that disables CSRF protection.
  trustedOrigins: (request) => {
    const list = [env.WEB_ORIGIN];
    const origin = request?.headers?.get('origin');
    if (isAllowedOrigin(origin) && origin !== env.WEB_ORIGIN) list.push(origin);
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

