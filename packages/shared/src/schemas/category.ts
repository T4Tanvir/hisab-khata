import { z } from 'zod';
import { CATEGORY_TYPES } from '../constants';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'ক্যাটাগরির নাম লিখুন').max(50),
  type: z.enum(CATEGORY_TYPES, {
    errorMap: () => ({ message: 'সঠিক ক্যাটাগরি ধরন নির্বাচন করুন' }),
  }),
  shortLabel: z.string().min(1, 'সংক্ষিপ্ত লেবেল দিন').max(4),
  color: z.coerce.number().int().min(1).max(9).default(1),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'ক্যাটাগরির নাম লিখুন').max(50).optional(),
  type: z.enum(CATEGORY_TYPES).optional(),
  shortLabel: z.string().min(1).max(4).optional(),
  color: z.coerce.number().int().min(1).max(9).optional(),
  archived: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

