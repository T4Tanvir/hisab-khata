import { toBengaliDigits } from './money';

export const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
] as const;

export function getDhakaDate(): string {
  // Returns YYYY-MM-DD in Asia/Dhaka timezone
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function getDhakaMonth(): string {
  // Returns YYYY-MM in Asia/Dhaka timezone
  const date = getDhakaDate();
  return date.slice(0, 7);
}

export function formatBengaliMonth(yearMonth: string): string {
  // yearMonth: "2026-10"
  const [year, month] = yearMonth.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  const monthName = BENGALI_MONTHS[monthIdx] ?? month;
  return `${monthName} ${toBengaliDigits(year)}`;
}

export function formatBengaliDate(isoDate: string): string {
  // isoDate: "2026-10-15"
  const [year, month, day] = isoDate.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  const monthName = BENGALI_MONTHS[monthIdx] ?? month;
  return `${toBengaliDigits(parseInt(day, 10))} ${monthName}, ${toBengaliDigits(year)}`;
}


/**
 * Adds (or subtracts) whole days to a YYYY-MM-DD date string.
 * Pure calendar arithmetic in UTC, so it is not affected by the host timezone.
 */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Today's (or N days ago) date in Asia/Dhaka as YYYY-MM-DD. */
export function getDhakaDateDaysAgo(daysAgo: number): string {
  return addDaysToIsoDate(getDhakaDate(), -daysAgo);
}

/** True when the string is YYYY-MM-DD and a real calendar date (rejects 2026-13-45, 2026-02-30). */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** True when the string is YYYY-MM with a month between 01 and 12. */
export function isValidYearMonth(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const m = Number(value.slice(5, 7));
  return m >= 1 && m <= 12;
}

/**
 * Returns the half-open date range [start, end) covering a YYYY-MM month,
 * e.g. "2026-11" → { start: "2026-11-01", end: "2026-12-01" }.
 */
export function monthDateRange(yearMonth: string): { start: string; end: string } {
  const [y, m] = yearMonth.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  return { start, end };
}
