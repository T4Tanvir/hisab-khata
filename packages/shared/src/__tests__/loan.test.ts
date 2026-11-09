import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createLoanSchema,
  updateLoanSchema,
  createLoanPaymentSchema,
  createTransactionSchema,
} from '../index';

describe('Loan Schemas & Validation (@hisab/shared)', () => {
  it('validates borrowed loan with wallet successfully', () => {
    const valid = createLoanSchema.safeParse({
      direction: 'borrowed',
      personName: 'করিম ভাই',
      personPhone: '01711223344',
      principal: 10000,
      startedOn: '2026-11-09',
      dueOn: '2026-12-09',
      note: 'জরুরি প্রয়োজনে ধার',
      affectWallet: true,
      walletId: 'w-1',
    });
    assert.strictEqual(valid.success, true);
  });

  it('validates pre-existing loan without wallet (affectWallet: false)', () => {
    const valid = createLoanSchema.safeParse({
      direction: 'lent',
      personName: 'রহিম চাচা',
      principal: 5000,
      startedOn: '2026-10-01',
      affectWallet: false,
    });
    assert.strictEqual(valid.success, true);
  });

  it('rejects loan with affectWallet true but no walletId', () => {
    const invalid = createLoanSchema.safeParse({
      direction: 'lent',
      personName: 'রহিম চাচা',
      principal: 5000,
      startedOn: '2026-10-01',
      affectWallet: true,
      walletId: '',
    });
    assert.strictEqual(invalid.success, false);
    if (!invalid.success) {
      assert.ok(invalid.error.issues.some((i) => i.path.includes('walletId')));
    }
  });

  it('validates loan repayment schema', () => {
    const valid = createLoanPaymentSchema.safeParse({
      amount: 2000,
      walletId: 'w-1',
      occurredOn: '2026-11-15',
      note: 'প্রথম কিস্তি পরিশোধ',
    });
    assert.strictEqual(valid.success, true);
  });

  it('rejects loan_in/loan_out through the general transaction schema (loans module only)', () => {
    for (const type of ['loan_in', 'loan_out']) {
      const r = createTransactionSchema.safeParse({
        type,
        amount: 5000,
        walletId: 'w-1',
        occurredOn: '2026-11-09',
      });
      assert.strictEqual(r.success, false, type);
    }
  });
});
