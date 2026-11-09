import { Hono } from 'hono';
import { familyService } from './family.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import { createHouseholdSchema, inviteFamilyMemberSchema, joinHouseholdSchema } from '@hisab/shared';

export const familyRoutes = new Hono<AuthContext>();

familyRoutes.use('*', requireAuth);

// GET /api/family - Get user's current household and members
familyRoutes.get('/', async (c) => {
  const user = c.get('user');
  const household = await familyService.getUserHousehold(user.id);
  return c.json({ data: household });
});

// POST /api/family - Create a new family household
familyRoutes.post('/', validateBody(createHouseholdSchema), async (c) => {
  const user = c.get('user');
  const { name } = c.get('validatedBody' as any);
  const household = await familyService.createHousehold(user.id, name);
  return c.json({ data: household }, 201);
});

// POST /api/family/invite - Owner invites a member by email
familyRoutes.post('/invite', validateBody(inviteFamilyMemberSchema), async (c) => {
  const user = c.get('user');
  const { email } = c.get('validatedBody' as any);
  const invite = await familyService.inviteMember(user.id, email);
  return c.json({ data: invite }, 201);
});

// POST /api/family/join - Join household with an invite code addressed to this user's email
familyRoutes.post('/join', validateBody(joinHouseholdSchema), async (c) => {
  const user = c.get('user');
  const { code } = c.get('validatedBody' as any);
  const household = await familyService.joinHousehold(user.id, user.email, code);
  return c.json({ data: household });
});

// DELETE /api/family/leave - Leave household (owner hands over to the next member)
familyRoutes.delete('/leave', async (c) => {
  const user = c.get('user');
  await familyService.leaveHousehold(user.id);
  return c.json({ data: { success: true } });
});
