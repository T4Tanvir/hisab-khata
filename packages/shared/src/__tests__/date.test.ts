import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatBengaliMonth,
  formatBengaliDate,
  formatMonth,
  formatDate,
  getDhakaDate,
  getDhakaMonth,
} from '../date';

describe('Date Utilities (@hisab/shared)', () => {
  it('formats Bengali Month correctly', () => {
    assert.strictEqual(formatBengaliMonth('2026-01'), 'জানুয়ারি ২০২৬');
    assert.strictEqual(formatBengaliMonth('2026-11'), 'নভেম্বর ২০২৬');
    assert.strictEqual(formatBengaliMonth('2026-12'), 'ডিসেম্বর ২০২৬');
  });

  it('formats English Month correctly', () => {
    assert.strictEqual(formatMonth('2026-01', 'en'), 'January 2026');
    assert.strictEqual(formatMonth('2026-11', 'en'), 'November 2026');
    assert.strictEqual(formatMonth('2026-12', 'en'), 'December 2026');
  });

  it('formats Bengali Date correctly', () => {
    assert.strictEqual(formatBengaliDate('2026-11-08'), '৮ নভেম্বর, ২০২৬');
    assert.strictEqual(formatBengaliDate('2026-04-14'), '১৪ এপ্রিল, ২০২৬');
    assert.strictEqual(formatBengaliDate('2026-12-31'), '৩১ ডিসেম্বর, ২০২৬');
  });

  it('formats English Date correctly', () => {
    assert.strictEqual(formatDate('2026-11-08', 'en'), '8 November, 2026');
    assert.strictEqual(formatDate('2026-04-14', 'en'), '14 April, 2026');
  });

  it('returns valid Dhaka date and month strings', () => {
    const dDate = getDhakaDate();
    assert.match(dDate, /^\d{4}-\d{2}-\d{2}$/);

    const dMonth = getDhakaMonth();
    assert.match(dMonth, /^\d{4}-\d{2}$/);
    assert.strictEqual(dMonth, dDate.slice(0, 7));
  });
});
