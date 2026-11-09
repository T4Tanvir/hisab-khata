import { z } from 'zod';
import { amountSchema, optionalMonthSchema } from './common';

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, 'লক্ষ্যের নাম দিন').max(100),
  targetAmount: amountSchema,
  dueMonth: optionalMonthSchema,
  note: z.string().max(255).optional().nullable(),
});

export const updateGoalSchema = z.object({
  name: z.string().trim().min(1, 'লক্ষ্যের নাম দিন').max(100).optional(),
  targetAmount: amountSchema.optional(),
  dueMonth: optionalMonthSchema,
  note: z.string().max(255).optional().nullable(),
});

export const contributeGoalSchema = z.object({
  amount: amountSchema,
  walletId: z.string().min(1, 'ওয়ালেট নির্বাচন করুন'),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type ContributeGoalInput = z.infer<typeof contributeGoalSchema>;
