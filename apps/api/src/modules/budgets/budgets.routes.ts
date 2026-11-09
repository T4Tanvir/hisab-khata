import { Hono } from 'hono';
import { budgetsService } from './budgets.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import { AppError } from '../../lib/errors';
import { setBudgetSchema, getDhakaMonth, monthSchema } from '@hisab/shared';

export const budgetsRoutes = new Hono<AuthContext>();

// Require auth on all budget routes
budgetsRoutes.use('*', requireAuth);

// GET /api/budgets - Get all expense categories with budget and spent info
budgetsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const month = monthSchema.parse(c.req.query('month') || getDhakaMonth());

  const list = await budgetsService.getBudgets(user.id, month);
  return c.json({ data: list });
});

// GET /api/budgets/summary - Get summary metrics for the month
budgetsRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  const month = monthSchema.parse(c.req.query('month') || getDhakaMonth());

  const summary = await budgetsService.getBudgetSummary(user.id, month);
  return c.json({ data: summary });
});

// PUT /api/budgets/:categoryId - Set or update budget limit for a category
budgetsRoutes.put('/:categoryId', validateBody(setBudgetSchema), async (c) => {
  const user = c.get('user');
  const categoryId = c.req.param('categoryId');
  const body = c.get('validatedBody' as any);

  const updated = await budgetsService.setBudget(user.id, categoryId, body);
  return c.json({ data: updated });
});

// DELETE /api/budgets/:categoryId - Remove budget limit for a category
budgetsRoutes.delete('/:categoryId', async (c) => {
  const user = c.get('user');
  const categoryId = c.req.param('categoryId');
  const month = monthSchema.parse(c.req.query('month') || getDhakaMonth());

  const success = await budgetsService.deleteBudget(user.id, categoryId, month);
  if (!success) throw new AppError('ক্যাটাগরিটি খুঁজে পাওয়া যায়নি', 404, 'CATEGORY_NOT_FOUND');
  return c.json({
    data: {
      success,
      message: 'বাজেট সীমা অপসারণ করা হয়েছে',
    },
  });
});
