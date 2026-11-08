import { Hono } from 'hono';
import { familyService } from './family.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import {
  createHouseholdSchema,
  inviteFamilyMemberSchema,
  joinHouseholdSchema,
} from '@hisab/shared';

export const familyRoutes = new Hono<AuthContext>();

familyRoutes.use('*', requireAuth);

// GET /api/family - Get user's current household and members
familyRoutes.get('/', async (c) => {
  const user = c.get('user');
  const household = await familyService.getUserHousehold(user.id);
  return c.json({ data: household });
});

// POST /api/family - Create a new family household
familyRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = createHouseholdSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400);
  }

  try {
    const household = await familyService.createHousehold(user.id, parsed.data.name);
    return c.json({ data: household }, 201);
  } catch (err: any) {
    return c.json({ error: { code: 'HOUSEHOLD_ERROR', message: err.message } }, 400);
  }
});

// POST /api/family/invite - Invite a member by email
familyRoutes.post('/invite', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = inviteFamilyMemberSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400);
  }

  try {
    const invite = await familyService.inviteMember(user.id, parsed.data.email);
    return c.json({ data: invite }, 201);
  } catch (err: any) {
    return c.json({ error: { code: 'INVITE_ERROR', message: err.message } }, 400);
  }
});

// POST /api/family/join - Join household with 6-digit code
familyRoutes.post('/join', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = joinHouseholdSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400);
  }

  try {
    const household = await familyService.joinHousehold(user.id, parsed.data.code);
    return c.json({ data: household });
  } catch (err: any) {
    return c.json({ error: { code: 'JOIN_ERROR', message: err.message } }, 400);
  }
});

// DELETE /api/family/leave - Leave household
familyRoutes.delete('/leave', async (c) => {
  const user = c.get('user');
  await familyService.leaveHousehold(user.id);
  return c.json({ data: { success: true } });
});
