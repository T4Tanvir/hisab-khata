import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createTransactionSchema,
  createWalletSchema,
  setBudgetSchema,
  createGoalSchema,
  createRecurringSchema,
} from '../index';

describe('Validation Schemas (@hisab/shared)', () => {
  it('validates income and expense transaction successfully', () => {
    const validExpense = {
      type: 'expense',
      amount: 500,
      walletId: 'w-1',
      categoryId: 'c-1',
      occurredOn: '2026-11-08',
      note: 'বাজার খরচ',
    };
    const res = createTransactionSchema.safeParse(validExpense);
    assert.strictEqual(res.success, true);
  });

  it('rejects expense transaction without categoryId', () => {
    const invalidExpense = {
      type: 'expense',
      amount: 500,
      walletId: 'w-1',
      occurredOn: '2026-11-08',
    };
    const res = createTransactionSchema.safeParse(invalidExpense);
    assert.strictEqual(res.success, false);
  });

  it('validates transfer transaction with different destination wallet', () => {
    const validTransfer = {
      type: 'transfer',
      amount: 1000,
      walletId: 'w-1',
      toWalletId: 'w-2',
      occurredOn: '2026-11-08',
    };
    const res = createTransactionSchema.safeParse(validTransfer);
    assert.strictEqual(res.success, true);
  });

  it('rejects transfer transaction with same source and destination wallet', () => {
    const invalidTransfer = {
      type: 'transfer',
      amount: 1000,
      walletId: 'w-1',
      toWalletId: 'w-1',
      occurredOn: '2026-11-08',
    };
    const res = createTransactionSchema.safeParse(invalidTransfer);
    assert.strictEqual(res.success, false);
  });

  it('validates wallet schema', () => {
    const validWallet = {
      name: 'ডাচ বাংলা ব্যাংক',
      type: 'bank',
      openingBalance: 5000,
    };
    const res = createWalletSchema.safeParse(validWallet);
    assert.strictEqual(res.success, true);
  });

  it('validates budget schema', () => {
    const validBudget = {
      month: '2026-11',
      amount: 15000,
    };
    const res = setBudgetSchema.safeParse(validBudget);
    assert.strictEqual(res.success, true);
  });

  it('validates goal schema', () => {
    const validGoal = {
      name: 'ল্যাপটপ কেনা',
      targetAmount: 85000,
      dueMonth: '2027-03',
    };
    const res = createGoalSchema.safeParse(validGoal);
    assert.strictEqual(res.success, true);
  });

  it('validates recurring rule schema', () => {
    const validRecurring = {
      type: 'expense',
      amount: 1200,
      walletId: 'w-1',
      categoryId: 'c-1',
      frequency: 'monthly',
      dayOfMonth: 5,
      nextDueOn: '2026-12-05',
      note: 'ওয়াইফাই বিল',
    };
    const res = createRecurringSchema.safeParse(validRecurring);
    assert.strictEqual(res.success, true);
  });
});
