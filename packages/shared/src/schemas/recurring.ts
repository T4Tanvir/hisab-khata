import { z } from 'zod';
import { RECURRING_FREQUENCIES, CATEGORY_TYPES } from '../constants';
import { amountSchema, isoDateSchema } from './common';

const recurringFields = {
  type: z.enum(CATEGORY_TYPES),
  amount: amountSchema,
  walletId: z.string().min(1, 'ওয়ালেট নির্বাচন করুন'),
  categoryId: z.string().min(1, 'ক্যাটাগরি নির্বাচন করুন'),
  frequency: z.enum(RECURRING_FREQUENCIES).default('monthly'),
  dayOfMonth: z.coerce
    .number({ invalid_type_error: 'মাসের দিন লিখুন (১-৩১)' })
    .int()
    .min(1, 'মাসের দিন ১ থেকে ৩১ এর মধ্যে হতে হবে')
    .max(31, 'মাসের দিন ১ থেকে ৩১ এর মধ্যে হতে হবে'),
  nextDueOn: isoDateSchema,
  note: z.string().max(255).optional().nullable(),
};

export const createRecurringSchema = z.object(recurringFields);

/** PATCH body: any subset of the create fields, plus pausing/resuming the rule. */
export const updateRecurringSchema = z
  .object({
    ...recurringFields,
    frequency: z.enum(RECURRING_FREQUENCIES),
    active: z.boolean(),
  })
  .partial(); // unknown keys are stripped, never written

export const payRecurringSchema = z.object({
  walletId: z.string().min(1).optional(),
  occurredOn: isoDateSchema.optional(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
export type PayRecurringInput = z.infer<typeof payRecurringSchema>;
