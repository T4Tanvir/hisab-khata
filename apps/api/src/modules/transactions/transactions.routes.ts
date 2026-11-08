import { Hono } from 'hono';
import { transactionsService } from './transactions.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFilterSchema,
  getDhakaMonth,
} from '@hisab/shared';

export const transactionsRoutes = new Hono<AuthContext>();

// Require authentication on all transaction routes
transactionsRoutes.use('*', requireAuth);

// GET /api/transactions - List transactions with optional filters
transactionsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const query = c.req.query();

  const parseResult = transactionFilterSchema.safeParse(query);
  const filters = parseResult.success ? parseResult.data : { limit: 50 };

  const txs = await transactionsService.getTransactions(user.id, filters);
  return c.json({ data: txs });
});

// GET /api/transactions/summary - Get monthly totals (income, expense, savings)
transactionsRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  const month = c.req.query('month') || getDhakaMonth();

  const summary = await transactionsService.getMonthSummary(user.id, month);
  return c.json({ data: summary });
});

// GET /api/transactions/:id - Get single transaction
transactionsRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const tx = await transactionsService.getTransactionById(user.id, id);
  if (!tx) {
    return c.json(
      {
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'লেনদেনটি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }

  return c.json({ data: tx });
});

// POST /api/transactions - Create new transaction
transactionsRoutes.post('/', validateBody(createTransactionSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody' as any);

  try {
    const result = await transactionsService.createTransaction(user.id, body);
    return c.json({ data: result.transaction, budgetAlert: result.budgetAlert }, 201);
  } catch (err: any) {
    return c.json(
      {
        error: {
          code: 'CREATE_TRANSACTION_FAILED',
          message: err.message || 'লেনদেন সংরক্ষণ করা সম্ভব হয়নি',
        },
      },
      400
    );
  }
});

// PATCH /api/transactions/:id - Update transaction
transactionsRoutes.patch('/:id', validateBody(updateTransactionSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.get('validatedBody' as any);

  try {
    const updated = await transactionsService.updateTransaction(user.id, id, body);
    if (!updated) {
      return c.json(
        {
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'লেনদেনটি খুঁজে পাওয়া যায়নি',
          },
        },
        404
      );
    }
    return c.json({ data: updated });
  } catch (err: any) {
    return c.json(
      {
        error: {
          code: 'UPDATE_TRANSACTION_FAILED',
          message: err.message || 'লেনদেন পরিবর্তন করা সম্ভব হয়নি',
        },
      },
      400
    );
  }
});

// DELETE /api/transactions/:id - Delete transaction
transactionsRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const deleted = await transactionsService.deleteTransaction(user.id, id);
  if (!deleted) {
    return c.json(
      {
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'লেনদেনটি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }

  return c.json({
    data: {
      message: 'লেনদেনটি মুছে ফেলা হয়েছে',
      id,
    },
  });
});
