import { Hono } from 'hono';
import { recurringService } from './recurring.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import { AppError } from '../../lib/errors';
import { createRecurringSchema, updateRecurringSchema, payRecurringSchema } from '@hisab/shared';

export const recurringRoutes = new Hono<AuthContext>();

const notFound = () => new AppError('নিয়মটি খুঁজে পাওয়া যায়নি', 404, 'RULE_NOT_FOUND');

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
  const created = await recurringService.createRule(user.id, c.get('validatedBody' as any));
  return c.json({ data: created }, 201);
});

// PATCH /api/recurring/:id - Update rule (validated; unknown fields ignored)
recurringRoutes.patch('/:id', validateBody(updateRecurringSchema), async (c) => {
  const user = c.get('user');
  const updated = await recurringService.updateRule(user.id, c.req.param('id'), c.get('validatedBody' as any));
  if (!updated) throw notFound();
  return c.json({ data: updated });
});

// DELETE /api/recurring/:id - Delete rule
recurringRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const deleted = await recurringService.deleteRule(user.id, c.req.param('id'));
  if (!deleted) throw notFound();
  return c.json({ data: { message: 'নিয়মটি মুছে ফেলা হয়েছে' } });
});

// POST /api/recurring/:id/pay - Record payment for recurring bill
recurringRoutes.post('/:id/pay', validateBody(payRecurringSchema), async (c) => {
  const user = c.get('user');
  const result = await recurringService.payRule(user.id, c.req.param('id'), c.get('validatedBody' as any));
  return c.json({ data: result });
});
