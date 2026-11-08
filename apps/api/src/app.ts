import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth/auth';
import { requireAuth } from './middleware/require-auth';
import { errorHandler } from './middleware/error-handler';
import { isAllowedOrigin } from './lib/origins';
import { walletsRoutes } from './modules/wallets/wallets.routes';
import { categoriesRoutes } from './modules/categories/categories.routes';
import { transactionsRoutes } from './modules/transactions/transactions.routes';
import { budgetsRoutes } from './modules/budgets/budgets.routes';
import { reportsRoutes } from './modules/reports/reports.routes';

export const app = new Hono();

// CORS Middleware
app.use(
  '*',
  cors({
    // Echo the origin back only when it is allowed; otherwise send no CORS header
    origin: (origin) => (isAllowedOrigin(origin) ? origin : null),
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
// Better Auth docs pattern for Hono: a single '*' matches all nested auth paths
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

// Current User check
app.get('/api/me', requireAuth, (c) => {
  const user = c.get('user');
  return c.json({ data: user });
});

// App Feature Routes
app.route('/api/wallets', walletsRoutes);
app.route('/api/categories', categoriesRoutes);
app.route('/api/transactions', transactionsRoutes);
app.route('/api/budgets', budgetsRoutes);
app.route('/api/reports', reportsRoutes);

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

