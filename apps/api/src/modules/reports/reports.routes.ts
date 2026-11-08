import { Hono } from 'hono';
import { reportsService } from './reports.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { getDhakaMonth } from '@hisab/shared';

export const reportsRoutes = new Hono<AuthContext>();

reportsRoutes.use('*', requireAuth);

// GET /api/reports/summary - Consolidated Dashboard Summary
reportsRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  const month = c.req.query('month') || getDhakaMonth();

  const summary = await reportsService.getDashboardSummary(user.id, month);
  return c.json({ data: summary });
});
