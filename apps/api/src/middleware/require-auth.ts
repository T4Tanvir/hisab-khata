import { createMiddleware } from 'hono/factory';
import { auth } from '../auth/auth';

export type AuthContext = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
};

export const requireAuth = createMiddleware<AuthContext>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'লগইন করা প্রয়োজন',
        },
      },
      401
    );
  }

  c.set('user', session.user);
  c.set('session', session.session);

  await next();
});

