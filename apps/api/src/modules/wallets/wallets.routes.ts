import { Hono } from 'hono';
import { walletsService } from './wallets.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import { createWalletSchema, updateWalletSchema } from '@hisab/shared';

export const walletsRoutes = new Hono<AuthContext>();

// Require authentication on all wallet routes
walletsRoutes.use('*', requireAuth);

// GET /api/wallets - List user wallets with balances
walletsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const wallets = await walletsService.getUserWallets(user.id);
  return c.json({ data: wallets });
});

// POST /api/wallets - Create a new wallet
walletsRoutes.post('/', validateBody(createWalletSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody' as any);
  const created = await walletsService.createWallet(user.id, body);
  return c.json({ data: created }, 201);
});

// PATCH /api/wallets/:id - Update an existing wallet
walletsRoutes.patch('/:id', validateBody(updateWalletSchema), async (c) => {
  const user = c.get('user');
  const walletId = c.req.param('id');
  const body = c.get('validatedBody' as any);

  const updated = await walletsService.updateWallet(user.id, walletId, body);
  if (!updated) {
    return c.json(
      {
        error: {
          code: 'WALLET_NOT_FOUND',
          message: 'ওয়ালেটটি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }

  return c.json({ data: updated });
});

// DELETE /api/wallets/:id - Delete or archive a wallet
walletsRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const walletId = c.req.param('id');

  const result = await walletsService.deleteWallet(user.id, walletId);
  if (!result) {
    return c.json(
      {
        error: {
          code: 'WALLET_NOT_FOUND',
          message: 'ওয়ালেটটি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }

  return c.json({
    data: {
      message: result.archived
        ? 'লেনদেন বিদ্যমান থাকায় ওয়ালেটটি আর্কাইভ করা হয়েছে'
        : 'ওয়ালেট সফলভাবে মুছে ফেলা হয়েছে',
      ...result,
    },
  });
});
