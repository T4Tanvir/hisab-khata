import { Hono } from 'hono';
import { loansService } from './loans.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import {
  createLoanSchema,
  updateLoanSchema,
  createLoanPaymentSchema,
  loanFilterSchema,
} from '@hisab/shared';

export const loansRoutes = new Hono<AuthContext>();

loansRoutes.use('*', requireAuth);

// GET /api/loans - List all user loans
loansRoutes.get('/', async (c) => {
  const user = c.get('user');
  const query = loanFilterSchema.parse(c.req.query());
  const loanList = await loansService.getLoans(user.id, query);
  return c.json({ data: loanList });
});

// GET /api/loans/summary - Loan summary metrics
loansRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  const summary = await loansService.getLoanSummary(user.id);
  return c.json({ data: summary });
});

// GET /api/loans/:id - Single loan details with transaction history
loansRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const loan = await loansService.getLoanById(user.id, id);
  if (!loan) {
    return c.json(
      {
        error: {
          code: 'LOAN_NOT_FOUND',
          message: 'ধার-দেনার তথ্যটি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }
  return c.json({ data: loan });
});

// POST /api/loans - Create new loan
loansRoutes.post('/', validateBody(createLoanSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody' as any);
  const created = await loansService.createLoan(user.id, body);
  return c.json({ data: created }, 201);
});

// PATCH /api/loans/:id - Update loan
loansRoutes.patch('/:id', validateBody(updateLoanSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.get('validatedBody' as any);
  const updated = await loansService.updateLoan(user.id, id, body);
  return c.json({ data: updated });
});

// POST /api/loans/:id/payments - Record a repayment or collection
loansRoutes.post('/:id/payments', validateBody(createLoanPaymentSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.get('validatedBody' as any);
  const updated = await loansService.createPayment(user.id, id, body);
  return c.json({ data: updated }, 201);
});

// DELETE /api/loans/:id - Delete loan
loansRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const success = await loansService.deleteLoan(user.id, id);
  if (!success) {
    return c.json(
      {
        error: {
          code: 'LOAN_NOT_FOUND',
          message: 'ধার-দেনার তথ্যটি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }
  return c.json({ data: { success: true } });
});
