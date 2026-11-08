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

// GET /api/reports/trend - Multi-month trend for charts
reportsRoutes.get('/trend', async (c) => {
  const user = c.get('user');
  const monthsCount = parseInt(c.req.query('months') || '6', 10);

  const trend = await reportsService.getTrend(user.id, monthsCount);
  return c.json({ data: trend });
});

// GET /api/reports/categories - Detailed category comparison
reportsRoutes.get('/categories', async (c) => {
  const user = c.get('user');
  const month = c.req.query('month') || getDhakaMonth();

  const breakdown = await reportsService.getCategoryBreakdown(user.id, month);
  return c.json({ data: breakdown });
});

// GET /api/reports/export - CSV file download
reportsRoutes.get('/export', async (c) => {
  const user = c.get('user');
  const month = c.req.query('month');

  const csv = await reportsService.getExportCsv(user.id, month);
  const filename = month ? `hisab-khata-${month}.csv` : 'hisab-khata-all.csv';

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});
