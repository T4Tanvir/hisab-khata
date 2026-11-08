import { Hono } from 'hono';
import { recurringService } from './recurring.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import { createRecurringSchema, payRecurringSchema } from '@hisab/shared';

export const recurringRoutes = new Hono<AuthContext>();

recurringRoutes.use('*', requireAuth);

// GET /api/recurring - List all recurring rules
recurringRoutes.get('/', async (c) => {
  const user = c.get('user');
  const rules = await recurringService.getUserRules(user.id);
  return c.json({ data: rules });
});

// POST /api/recurring - Create new recurring rule
recurringRoutes.post('/', validateBody(createRecurringSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody' as any);

  try {
    const created = await recurringService.createRule(user.id, body);
    return c.json({ data: created }, 201);
  } catch (err: any) {
    return c.json(
      {
        error: {
          code: 'CREATE_RECURRING_FAILED',
          message: err.message || 'নিয়মিত লেনদেন সংরক্ষণ করা যায়নি',
        },
      },
      400
    );
  }
});

// PATCH /api/recurring/:id - Update rule
recurringRoutes.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();

  const updated = await recurringService.updateRule(user.id, id, body);
  if (!updated) {
    return c.json(
      {
        error: {
          code: 'RULE_NOT_FOUND',
          message: 'নিয়মটি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }

  return c.json({ data: updated });
});

// DELETE /api/recurring/:id - Delete rule
recurringRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const deleted = await recurringService.deleteRule(user.id, id);
  if (!deleted) {
    return c.json(
      {
        error: {
          code: 'RULE_NOT_FOUND',
          message: 'নিয়মটি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }

  return c.json({ data: { message: 'নিয়মটি মুছে ফেলা হয়েছে' } });
});

// POST /api/recurring/:id/pay - Record payment for recurring bill
recurringRoutes.post('/:id/pay', validateBody(payRecurringSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.get('validatedBody' as any);

  try {
    const result = await recurringService.payRule(user.id, id, body);
    return c.json({ data: result });
  } catch (err: any) {
    return c.json(
      {
        error: {
          code: 'PAY_RECURRING_FAILED',
          message: err.message || 'পরিশোধ সম্পন্ন করা সম্ভব হয়নি',
        },
      },
      400
    );
  }
});
