import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth/auth';
import { requireAuth } from './middleware/require-auth';
import { errorHandler } from './middleware/error-handler';
import { env } from './env';

export const app = new Hono();

// CORS Middleware
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow localhost and web origin
      if (!origin || origin === env.WEB_ORIGIN || origin.includes('localhost')) {
        return origin || '*';
      }
      return env.WEB_ORIGIN;
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// Error Handling
app.onError(errorHandler);

// Health Check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'hisab-khata-api',
    time: new Date().toISOString(),
  });
});

// Better Auth handler
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw);
});

// Current User check
app.get('/api/me', requireAuth, (c) => {
  const user = c.get('user');
  return c.json({ data: user });
});

// 404 Handler
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'অনুরোধকৃত পথটি খুঁজে পাওয়া যায়নি',
      },
    },
    404
  );
});

