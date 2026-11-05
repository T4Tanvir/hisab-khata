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

