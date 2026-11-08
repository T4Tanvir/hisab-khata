import { Hono } from 'hono';
import { budgetsService } from './budgets.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import { setBudgetSchema, getDhakaMonth } from '@hisab/shared';

export const budgetsRoutes = new Hono<AuthContext>();

// Require auth on all budget routes
budgetsRoutes.use('*', requireAuth);

// GET /api/budgets - Get all expense categories with budget and spent info
budgetsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const month = c.req.query('month') || getDhakaMonth();

  const list = await budgetsService.getBudgets(user.id, month);
  return c.json({ data: list });
});

// GET /api/budgets/summary - Get summary metrics for the month
budgetsRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  const month = c.req.query('month') || getDhakaMonth();

  const summary = await budgetsService.getBudgetSummary(user.id, month);
  return c.json({ data: summary });
});

// PUT /api/budgets/:categoryId - Set or update budget limit for a category
budgetsRoutes.put('/:categoryId', validateBody(setBudgetSchema), async (c) => {
  const user = c.get('user');
  const categoryId = c.req.param('categoryId');
  const body = c.get('validatedBody' as any);

  try {
    const updated = await budgetsService.setBudget(user.id, categoryId, body);
    return c.json({ data: updated });
  } catch (err: any) {
    return c.json(
      {
        error: {
          code: 'SET_BUDGET_FAILED',
          message: err.message || 'বাজেট সংরক্ষণ করা সম্ভব হয়নি',
        },
      },
      400
    );
  }
});

// DELETE /api/budgets/:categoryId - Remove budget limit for a category
budgetsRoutes.delete('/:categoryId', async (c) => {
  const user = c.get('user');
  const categoryId = c.req.param('categoryId');
  const month = c.req.query('month') || getDhakaMonth();

  const success = await budgetsService.deleteBudget(user.id, categoryId, month);
  return c.json({
    data: {
      success,
      message: 'বাজেট সীমা অপসারণ করা হয়েছে',
    },
  });
});
