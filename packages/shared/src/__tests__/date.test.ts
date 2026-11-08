import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatBengaliMonth,
  formatBengaliDate,
  getDhakaDate,
  getDhakaMonth,
} from '../date';

describe('Date Utilities (@hisab/shared)', () => {
  it('formats Bengali Month correctly', () => {
    assert.strictEqual(formatBengaliMonth('2026-01'), 'জানুয়ারি ২০২৬');
    assert.strictEqual(formatBengaliMonth('2026-11'), 'নভেম্বর ২০২৬');
    assert.strictEqual(formatBengaliMonth('2026-12'), 'ডিসেম্বর ২০২৬');
  });

  it('formats Bengali Date correctly', () => {
    assert.strictEqual(formatBengaliDate('2026-11-08'), '৮ নভেম্বর, ২০২৬');
    assert.strictEqual(formatBengaliDate('2026-04-14'), '১৪ এপ্রিল, ২০২৬');
    assert.strictEqual(formatBengaliDate('2026-12-31'), '৩১ ডিসেম্বর, ২০২৬');
  });

  it('returns valid Dhaka date and month strings', () => {
    const dDate = getDhakaDate();
    assert.match(dDate, /^\d{4}-\d{2}-\d{2}$/);

    const dMonth = getDhakaMonth();
    assert.match(dMonth, /^\d{4}-\d{2}$/);
    assert.strictEqual(dMonth, dDate.slice(0, 7));
  });
});
