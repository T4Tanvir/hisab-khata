import { Hono } from 'hono';
import { goalsService } from './goals.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import { createGoalSchema, updateGoalSchema, contributeGoalSchema } from '@hisab/shared';

export const goalsRoutes = new Hono<AuthContext>();

goalsRoutes.use('*', requireAuth);

// GET /api/goals - List all user savings goals
goalsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const goalsList = await goalsService.getUserGoals(user.id);
  return c.json({ data: goalsList });
});

// GET /api/goals/:id - Get single goal
goalsRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const goal = await goalsService.getGoalById(user.id, id);
  if (!goal) {
    return c.json(
      {
        error: {
          code: 'GOAL_NOT_FOUND',
          message: 'সঞ্চয়ের লক্ষ্যটি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }
  return c.json({ data: goal });
});

// POST /api/goals - Create new goal
goalsRoutes.post('/', validateBody(createGoalSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody' as any);
  const created = await goalsService.createGoal(user.id, body);
  return c.json({ data: created }, 201);
});

// PATCH /api/goals/:id - Update goal
goalsRoutes.patch('/:id', validateBody(updateGoalSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.get('validatedBody' as any);
  const updated = await goalsService.updateGoal(user.id, id, body);
  if (!updated) {
    return c.json(
      {
        error: {
          code: 'GOAL_NOT_FOUND',
          message: 'লক্ষ্যটি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }
  return c.json({ data: updated });
});

// DELETE /api/goals/:id - Delete goal
goalsRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const deleted = await goalsService.deleteGoal(user.id, id);
  if (!deleted) {
    return c.json(
      {
        error: {
          code: 'GOAL_NOT_FOUND',
          message: 'লক্ষ্যটি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }
  return c.json({ data: { message: 'লক্ষ্যটি সফলভাবে মুছে ফেলা হয়েছে' } });
});

// POST /api/goals/:id/contribute - Deposit money into goal
goalsRoutes.post('/:id/contribute', validateBody(contributeGoalSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.get('validatedBody' as any);

  const result = await goalsService.contributeToGoal(user.id, id, body);
  return c.json({ data: result });
});
