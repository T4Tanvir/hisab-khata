import { Hono } from 'hono';
import { reportsService } from './reports.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { z } from 'zod';
import { getDhakaMonth, monthSchema, reportOverviewQuerySchema, reportExportQuerySchema } from '@hisab/shared';
import { reportOverviewService } from './overview.service';
import { AppError } from '../../lib/errors';

// Clamp to 1..24 months (one query per month); garbage falls back to 6
const monthsCountSchema = z.coerce
  .number()
  .int()
  .catch(6)
  .transform((n) => Math.min(24, Math.max(1, n)));

export const reportsRoutes = new Hono<AuthContext>();

reportsRoutes.use('*', requireAuth);

// GET /api/reports/summary - Consolidated Dashboard Summary
reportsRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  const month = monthSchema.parse(c.req.query('month') || getDhakaMonth());

  const summary = await reportsService.getDashboardSummary(user.id, month);
  return c.json({ data: summary });
});

// GET /api/reports/trend - Multi-month trend for charts
reportsRoutes.get('/trend', async (c) => {
  const user = c.get('user');
  const monthsCount = monthsCountSchema.parse(c.req.query('months') ?? 6);

  const trend = await reportsService.getTrend(user.id, monthsCount);
  return c.json({ data: trend });
});

// GET /api/reports/categories - Detailed category comparison
reportsRoutes.get('/categories', async (c) => {
  const user = c.get('user');
  const month = monthSchema.parse(c.req.query('month') || getDhakaMonth());

  const breakdown = await reportsService.getCategoryBreakdown(user.id, month);
  return c.json({ data: breakdown });
});

// GET /api/reports/insights - AI Financial Insights
reportsRoutes.get('/insights', async (c) => {
  const user = c.get('user');
  const month = monthSchema.parse(c.req.query('month') || getDhakaMonth());

  const insights = await reportsService.getFinancialInsights(user.id, month);
  return c.json({ data: insights });
});

// GET /api/reports/overview?period=1|3|6|12|ytd&end=YYYY-MM - Full period report
reportsRoutes.get('/overview', async (c) => {
  const user = c.get('user');
  const { period, end } = reportOverviewQuerySchema.parse(c.req.query());
  const overview = await reportOverviewService.getOverview(user.id, period, end);
  return c.json({ data: overview });
});

// GET /api/reports/export?from=YYYY-MM&to=YYYY-MM (or ?month=YYYY-MM) - CSV download
reportsRoutes.get('/export', async (c) => {
  const user = c.get('user');
  const q = reportExportQuerySchema.parse(c.req.query());
  const from = q.from ?? q.month;
  const to = q.to ?? q.month ?? q.from;
  if (from && to && from > to) throw new AppError('শুরুর মাস শেষের মাসের পরে হতে পারে না');

  const csv = await reportsService.getExportCsv(user.id, from && to ? { from, to } : undefined);
  const filename = !from ? 'hisab-khata-all.csv' : from === to ? `hisab-khata-${from}.csv` : `hisab-khata-${from}-to-${to}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});
