export const WALLET_TYPES = ['cash', 'bank', 'mobile', 'card'] as const;
export type WalletType = (typeof WALLET_TYPES)[number];

export const TRANSACTION_TYPES = ['income', 'expense', 'transfer'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CATEGORY_TYPES = ['income', 'expense'] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const RECURRING_FREQUENCIES = ['monthly', 'weekly'] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export const CATEGORY_COLORS = [
  'var(--cat-1, #e05d44)',
  'var(--cat-2, #d97736)',
  'var(--cat-3, #c99326)',
  'var(--cat-4, #3a9e68)',
  'var(--cat-5, #2f9490)',
  'var(--cat-6, #3b7bb5)',
  'var(--cat-7, #6b63b5)',
  'var(--cat-8, #b0528e)',
  'var(--cat-9, #70757a)',
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'খাবার ও মুদি', shortLabel: 'খা', color: 1, type: 'expense' },
  { name: 'বাড়ি ভাড়া ও বিল', shortLabel: 'ভা', color: 2, type: 'expense' },
  { name: 'যাতায়াত ও পরিবহন', shortLabel: 'যা', color: 3, type: 'expense' },
  { name: 'স্বাস্থ্য ও চিকিৎসা', shortLabel: 'স্বা', color: 4, type: 'expense' },
  { name: 'কেনাকাটা', shortLabel: 'কে', color: 5, type: 'expense' },
  { name: 'বিনোদন', shortLabel: 'বি', color: 6, type: 'expense' },
  { name: 'শিক্ষা', shortLabel: 'শি', color: 7, type: 'expense' },
  { name: 'অন্যান্য খরচ', shortLabel: 'অ', color: 9, type: 'expense' },
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'বেতন', shortLabel: 'বে', color: 4, type: 'income' },
  { name: 'ব্যবসা', shortLabel: 'ব্য', color: 5, type: 'income' },
  { name: 'ফ্রিল্যান্সিং', shortLabel: 'ফ্রি', color: 6, type: 'income' },
  { name: 'উপহার / অন্যান্য', shortLabel: 'উপ', color: 7, type: 'income' },
] as const;

