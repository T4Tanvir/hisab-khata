import { z } from 'zod';
import { LOAN_DIRECTIONS, LOAN_STATUSES } from '../constants';
import { amountSchema, isoDateSchema as occurredOnSchema, optionalIsoDateSchema } from './common';

export const createLoanSchema = z
  .object({
    direction: z.enum(LOAN_DIRECTIONS, {
      required_error: 'লোনের ধরন নির্বাচন করুন (দেনা বা পাওনা)',
    }),
    personName: z
      .string({ required_error: 'ব্যক্তির নাম লিখুন' })
      .trim()
      .min(1, 'ব্যক্তির নাম লিখুন')
      .max(100, 'নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারে'),
    personPhone: z
      .string()
      .trim()
      .max(20, 'ফোন নম্বর সর্বোচ্চ ২০ অক্ষরের হতে পারে')
      .optional()
      .nullable(),
    principal: amountSchema,
    startedOn: occurredOnSchema,
    dueOn: optionalIsoDateSchema,
    note: z.string().trim().max(255, 'নোট সর্বোচ্চ ২৫৫ অক্ষরের হতে পারে').optional().nullable(),
    affectWallet: z.boolean().default(true),
    walletId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.affectWallet) {
        return !!data.walletId && data.walletId.trim().length > 0;
      }
      return true;
    },
    {
      message: 'ওয়ালেটে লেনদেন যোগ করার জন্য একটি ওয়ালেট নির্বাচন করুন',
      path: ['walletId'],
    }
  )
  .refine((data) => !data.dueOn || data.dueOn >= data.startedOn, {
    message: 'পরিশোধের শেষ তারিখ শুরুর তারিখের আগে হতে পারে না',
    path: ['dueOn'],
  });

export const updateLoanSchema = z.object({
  personName: z
    .string()
    .trim()
    .min(1, 'ব্যক্তির নাম লিখুন')
    .max(100)
    .optional(),
  personPhone: z.string().trim().max(20).optional().nullable(),
  principal: amountSchema.optional(),
  startedOn: occurredOnSchema.optional(),
  dueOn: optionalIsoDateSchema,
  note: z.string().trim().max(255).optional().nullable(),
});

export const createLoanPaymentSchema = z.object({
  amount: amountSchema,
  walletId: z.string().min(1, 'ওয়ালেট নির্বাচন করুন'),
  occurredOn: occurredOnSchema,
  note: z.string().trim().max(255).optional().nullable(),
});

export const loanFilterSchema = z.object({
  direction: z.enum(LOAN_DIRECTIONS).optional(),
  status: z.enum(LOAN_STATUSES).optional(),
  q: z.string().max(100).optional(),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type CreateLoanPaymentInput = z.infer<typeof createLoanPaymentSchema>;
export type LoanFilterInput = z.input<typeof loanFilterSchema>;
