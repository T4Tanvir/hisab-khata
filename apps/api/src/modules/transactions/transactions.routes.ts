import { Hono } from 'hono';
import { transactionsService } from './transactions.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import { AppError } from '../../lib/errors';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFilterSchema,
  monthSchema,
  getDhakaMonth,
} from '@hisab/shared';

export const transactionsRoutes = new Hono<AuthContext>();

const notFound = () => new AppError('লেনদেনটি খুঁজে পাওয়া যায়নি', 404, 'TRANSACTION_NOT_FOUND');

// Require authentication on all transaction routes
transactionsRoutes.use('*', requireAuth);

// GET /api/transactions - List transactions with optional filters
transactionsRoutes.get('/', async (c) => {
  const user = c.get('user');
  // Invalid filters are rejected (ZodError → 400) instead of silently returning everything
  const filters = transactionFilterSchema.parse(c.req.query());

  const txs = await transactionsService.getTransactions(user.id, filters);
  return c.json({ data: txs });
});

// GET /api/transactions/summary - Get monthly totals (income, expense, savings)
transactionsRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  const month = monthSchema.parse(c.req.query('month') || getDhakaMonth());

  const summary = await transactionsService.getMonthSummary(user.id, month);
  return c.json({ data: summary });
});

// GET /api/transactions/:id - Get single transaction
transactionsRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const tx = await transactionsService.getTransactionById(user.id, c.req.param('id'));
  if (!tx) throw notFound();

  return c.json({ data: tx });
});

// POST /api/transactions - Create new transaction
transactionsRoutes.post('/', validateBody(createTransactionSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody' as any);

  const result = await transactionsService.createTransaction(user.id, body);
  return c.json({ data: result.transaction, budgetAlert: result.budgetAlert }, 201);
});

// PATCH /api/transactions/:id - Update transaction
transactionsRoutes.patch('/:id', validateBody(updateTransactionSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody' as any);

  const result = await transactionsService.updateTransaction(user.id, c.req.param('id'), body);
  if (!result) throw notFound();

  return c.json({ data: result.transaction, budgetAlert: result.budgetAlert });
});

// DELETE /api/transactions/:id - Delete transaction
transactionsRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const deleted = await transactionsService.deleteTransaction(user.id, id);
  if (!deleted) throw notFound();

  return c.json({
    data: {
      message: 'লেনদেনটি মুছে ফেলা হয়েছে',
      id,
    },
  });
});
