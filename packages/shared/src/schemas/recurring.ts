import { z } from 'zod';
import { RECURRING_FREQUENCIES } from '../constants';

export const createRecurringSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('টাকার পরিমাণ ০-এর বেশি হতে হবে'),
  walletId: z.string().min(1, 'ওয়ালেট নির্বাচন করুন'),
  categoryId: z.string().min(1, 'ক্যাটাগরি নির্বাচন করুন'),
  frequency: z.enum(RECURRING_FREQUENCIES).default('monthly'),
  dayOfMonth: z.coerce.number().int().min(1).max(31),
  nextDueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(255).optional().nullable(),
});

export const payRecurringSchema = z.object({
  walletId: z.string().optional(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type PayRecurringInput = z.infer<typeof payRecurringSchema>;

