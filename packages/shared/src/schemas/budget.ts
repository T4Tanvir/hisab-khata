import { z } from 'zod';
import { monthSchema } from './common';

export const setBudgetSchema = z.object({
  month: monthSchema,
  amount: z.coerce
    .number({ invalid_type_error: 'বাজেটের পরিমাণ লিখুন' })
    .min(0, 'বাজেট ০ বা তার বেশি হতে হবে')
    .max(1_000_000_000_000, 'বাজেটের পরিমাণ অনেক বেশি'), // Taka
});

export type SetBudgetInput = z.infer<typeof setBudgetSchema>;
