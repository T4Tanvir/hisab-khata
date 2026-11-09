import { z } from 'zod';
import { isValidIsoDate, isValidYearMonth } from '../date';

/** Positive money amount entered in Taka (converted to paisa on the server). */
export const amountSchema = z.coerce
  .number({ invalid_type_error: 'টাকার পরিমাণ লিখুন', required_error: 'টাকার পরিমাণ লিখুন' })
  .positive('টাকার পরিমাণ ০-এর বেশি হতে হবে')
  .max(1_000_000_000_000, 'টাকার পরিমাণ অনেক বেশি');

/** A real calendar date in YYYY-MM-DD (rejects 2026-02-30). */
export const isoDateSchema = z
  .string({ required_error: 'তারিখ লিখুন' })
  .refine(isValidIsoDate, 'সঠিক তারিখ লিখুন (YYYY-MM-DD)');

/** A real month in YYYY-MM (rejects 2026-13). */
export const monthSchema = z
  .string({ required_error: 'মাস লিখুন' })
  .refine(isValidYearMonth, 'সঠিক মাস লিখুন (YYYY-MM)');

/** Turns '' / whitespace-only form values into null so optional fields can be left blank. */
const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

/** Optional date: blank → null, otherwise must be a real YYYY-MM-DD date. */
export const optionalIsoDateSchema = z.preprocess(emptyToNull, isoDateSchema.nullable().optional());

/** Optional month: blank → null, otherwise must be a real YYYY-MM month. */
export const optionalMonthSchema = z.preprocess(emptyToNull, monthSchema.nullable().optional());
