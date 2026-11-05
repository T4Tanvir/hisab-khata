import { z } from 'zod';

export const setBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'মাস YYYY-MM ফরম্যাটে হতে হবে'),
  amount: z.coerce.number().min(0, 'বাজেট ০ বা তার বেশি হতে হবে'), // Taka
});

export type SetBudgetInput = z.infer<typeof setBudgetSchema>;

