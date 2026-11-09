import { useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * New accounts are seeded with Bengali category / wallet names (see
 * DEFAULT_EXPENSE_CATEGORIES etc. in @hisab/shared). Those are stored as user
 * data, so in English mode they would stay Bengali. While a name is still
 * exactly the seeded default, show its English equivalent instead.
 * Anything the user typed or renamed is shown as-is.
 */
const DEFAULTS: Record<string, { name: string; short?: string }> = {
  // expense categories
  'খাবার ও মুদি': { name: 'Food & Groceries', short: 'FG' },
  'বাড়ি ভাড়া ও বিল': { name: 'Rent & Bills', short: 'RB' },
  'যাতায়াত ও পরিবহন': { name: 'Transport', short: 'TR' },
  'স্বাস্থ্য ও চিকিৎসা': { name: 'Health & Medical', short: 'HM' },
  'কেনাকাটা': { name: 'Shopping', short: 'SH' },
  'বিনোদন': { name: 'Entertainment', short: 'EN' },
  'শিক্ষা': { name: 'Education', short: 'ED' },
  'অন্যান্য খরচ': { name: 'Other Expenses', short: 'OT' },
  // income categories
  'বেতন': { name: 'Salary', short: 'SA' },
  'ব্যবসা': { name: 'Business', short: 'BU' },
  'ফ্রিল্যান্সিং': { name: 'Freelancing', short: 'FR' },
  'উপহার / অন্যান্য': { name: 'Gifts / Other', short: 'GI' },
  // default wallet
  'নগদ': { name: 'Cash' },
};

// Bengali text can be stored in different Unicode forms (e.g. য় vs য + ়): compare NFC.
const LOOKUP = new Map(Object.entries(DEFAULTS).map(([bn, en]) => [bn.normalize('NFC'), en]));

const lookup = (value: unknown) =>
  typeof value === 'string' ? LOOKUP.get(value.normalize('NFC')) : undefined;

/** [name field, matching short-label field] pairs that may hold a seeded default. */
const NAME_FIELDS: Array<[string, string[]]> = [
  ['name', ['shortLabel']],
  // report rows pair categoryName with `shortLabel`, transactions with `categoryShortLabel`
  ['categoryName', ['categoryShortLabel', 'shortLabel']],
  ['walletName', []],
  ['toWalletName', []],
];

/** Returns `data` with seeded default names replaced by English (new objects only where changed). */
export function localizeDefaultNames<T>(data: T): T {
  if (Array.isArray(data)) {
    let changed = false;
    const out = data.map((item) => {
      const next = localizeDefaultNames(item);
      if (next !== item) changed = true;
      return next;
    });
    return (changed ? out : data) as T;
  }
  if (data === null || typeof data !== 'object' || Object.getPrototypeOf(data) !== Object.prototype) {
    return data;
  }

  const src = data as Record<string, unknown>;
  let copy: Record<string, unknown> | null = null;
  const set = (key: string, value: unknown) => {
    copy ??= { ...src };
    copy[key] = value;
  };

  for (const [nameKey, shortKeys] of NAME_FIELDS) {
    const hit = lookup(src[nameKey]);
    if (!hit) continue;
    set(nameKey, hit.name);
    for (const shortKey of shortKeys) {
      if (hit.short && typeof src[shortKey] === 'string') set(shortKey, hit.short);
    }
  }

  for (const [key, value] of Object.entries(src)) {
    if (value && typeof value === 'object') {
      const next = localizeDefaultNames(value);
      if (next !== value) set(key, next);
    }
  }

  return (copy ?? data) as T;
}

/**
 * `select` function for useQuery: in English mode, show seeded default names in
 * English; in Bengali mode, data is returned untouched.
 */
export function useDefaultNameLocalizer() {
  const { language } = useLanguage();
  return useCallback(
    <T,>(data: T): T => (language === 'en' ? localizeDefaultNames(data) : data),
    [language]
  );
}

/** Replaces seeded default Bengali names that appear inside a sentence (e.g. server-written insight text). */
export function localizeDefaultNamesInText(text: string): string {
  let out = text.normalize('NFC');
  // Longest names first so "অন্যান্য খরচ" wins over shorter overlaps
  const entries = [...LOOKUP.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [bn, en] of entries) out = out.split(bn).join(en.name);
  return out;
}
