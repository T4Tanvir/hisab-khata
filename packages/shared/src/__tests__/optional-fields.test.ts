import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createLoanSchema, createGoalSchema, createTransactionSchema, setBudgetSchema } from '../index';

const baseLoan = { direction: 'borrowed', personName: 'Karim', principal: 100, startedOn: '2026-11-09', affectWallet: false };

describe('optional date fields and stricter validation', () => {
  it('accepts a blank optional loan due date as null', () => {
    const r = createLoanSchema.safeParse({ ...baseLoan, dueOn: '' });
    assert.ok(r.success);
    assert.strictEqual(r.data.dueOn, null);
  });

  it('rejects a loan due date before the start date', () => {
    assert.ok(!createLoanSchema.safeParse({ ...baseLoan, dueOn: '2026-01-01' }).success);
  });

  it('accepts a blank goal due month and rejects month 13', () => {
    const blank = createGoalSchema.safeParse({ name: 'Laptop', targetAmount: 1000, dueMonth: '' });
    assert.ok(blank.success);
    assert.strictEqual(blank.data.dueMonth, null);
    assert.ok(!createGoalSchema.safeParse({ name: 'Laptop', targetAmount: 1000, dueMonth: '2026-13' }).success);
  });

  it('rejects budget month 2026-13', () => {
    assert.ok(!setBudgetSchema.safeParse({ month: '2026-13', amount: 10 }).success);
  });

  it('does not allow loan/saving types through the general transaction schema', () => {
    for (const type of ['loan_in', 'loan_out', 'saving']) {
      assert.ok(!createTransactionSchema.safeParse({ type, amount: 5, walletId: 'w', occurredOn: '2026-11-09' }).success, type);
    }
  });
});
