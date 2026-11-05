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
  trustedOrigins: [env.WEB_ORIGIN, 'http://localhost:5173', 'http://localhost:3000'],
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

