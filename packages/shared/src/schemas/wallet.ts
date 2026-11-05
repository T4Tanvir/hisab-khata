import { z } from 'zod';
import { WALLET_TYPES } from '../constants';

export const createWalletSchema = z.object({
  name: z.string().min(1, 'ওয়ালেটের নাম লিখুন').max(50),
  type: z.enum(WALLET_TYPES, {
    errorMap: () => ({ message: 'সঠিক ওয়ালেট ধরন নির্বাচন করুন' }),
  }),
  openingBalance: z.coerce.number().default(0), // user enters in Taka, converted to paisa in service/schema
});

export const updateWalletSchema = z.object({
  name: z.string().min(1, 'ওয়ালেটের নাম লিখুন').max(50).optional(),
  type: z.enum(WALLET_TYPES).optional(),
  openingBalance: z.coerce.number().optional(),
  archived: z.boolean().optional(),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;

