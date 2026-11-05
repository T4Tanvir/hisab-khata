import { z } from 'zod';

export const createGoalSchema = z.object({
  name: z.string().min(1, 'লক্ষ্যের নাম দিন').max(100),
  targetAmount: z.coerce.number().positive('লক্ষ্যের পরিমাণ ০-এর বেশি হতে হবে'),
  dueMonth: z.string().regex(/^\d{4}-\d{2}$/, 'সঠিক মাস (YYYY-MM) দিন').optional().nullable(),
  note: z.string().max(255).optional().nullable(),
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.coerce.number().positive().optional(),
  dueMonth: z.string().regex(/^\d{4}-\d{2}$/).optional().nullable(),
  note: z.string().max(255).optional().nullable(),
});

export const contributeGoalSchema = z.object({
  amount: z.coerce.number().positive('টাকার পরিমাণ ০-এর বেশি হতে হবে'),
  walletId: z.string().min(1, 'ওয়ালেট নির্বাচন করুন'),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type ContributeGoalInput = z.infer<typeof contributeGoalSchema>;

