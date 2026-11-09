import { z } from 'zod';
import { GENERAL_TRANSACTION_TYPES, TRANSACTION_TYPES } from '../constants';
import { amountSchema, isoDateSchema as occurredOnSchema, monthSchema } from './common';

export const createTransactionSchema = z
  .object({
    // Loan and saving transactions are created only through their own endpoints
    type: z.enum(GENERAL_TRANSACTION_TYPES),
    amount: amountSchema,
    walletId: z.string().min(1, 'ওয়ালেট নির্বাচন করুন'),
    toWalletId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    occurredOn: occurredOnSchema,
    note: z.string().max(255).optional().nullable(),
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
      if (data.type === 'income' || data.type === 'expense') {
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
  amount: amountSchema.optional(),
  walletId: z.string().optional(),
  toWalletId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  occurredOn: occurredOnSchema.optional(),
  note: z.string().max(255).optional().nullable(),
  loanId: z.string().optional().nullable(),
});

export const transactionFilterSchema = z.object({
  month: monthSchema.optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  categoryId: z.string().optional(),
  walletId: z.string().optional(),
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilterInput = z.input<typeof transactionFilterSchema>;

