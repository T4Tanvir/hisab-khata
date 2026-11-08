import { z } from 'zod';
import { TRANSACTION_TYPES } from '../constants';

export const createTransactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES),
    amount: z.coerce.number().positive('টাকার পরিমাণ ০-এর বেশি হতে হবে'), // in Taka
    walletId: z.string().min(1, 'ওয়ালেট নির্বাচন করুন'),
    toWalletId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'সঠিক তারিখ লিখুন (YYYY-MM-DD)'),
    note: z.string().max(255).optional().nullable(),
    recurringRuleId: z.string().optional().nullable(),
    goalId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === 'transfer') {
        return !!data.toWalletId && data.toWalletId !== data.walletId;
      }
      return true;
    },
    {
      message: 'ট্রান্সফারের ক্ষেত্রে ভিন্ন একটি গ্রহণকারী ওয়ালেট প্রয়োজন',
      path: ['toWalletId'],
    }
  )
  .refine(
    (data) => {
      if (data.type !== 'transfer') {
        return !!data.categoryId;
      }
      return true;
    },
    {
      message: 'ক্যাটাগরি নির্বাচন করুন',
      path: ['categoryId'],
    }
  );

export const updateTransactionSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  walletId: z.string().optional(),
  toWalletId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().max(255).optional().nullable(),
});

export const transactionFilterSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  categoryId: z.string().optional(),
  walletId: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilterInput = z.input<typeof transactionFilterSchema>;

