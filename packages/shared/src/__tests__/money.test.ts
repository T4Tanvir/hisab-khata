import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  takaToPaisa,
  paisaToTaka,
  formatSouthAsian,
  formatMoney,
  toBengaliDigits,
  toEnglishDigits,
} from '../money';

describe('Money Utilities (@hisab/shared)', () => {
  it('converts Taka to Paisa (BigInt) correctly', () => {
    assert.strictEqual(takaToPaisa(100), 10000n);
    assert.strictEqual(takaToPaisa(150.5), 15050n);
    assert.strictEqual(takaToPaisa('150.50'), 15050n);
    assert.strictEqual(takaToPaisa(0), 0n);
    // Bengali digits parsing
    assert.strictEqual(takaToPaisa('১৫০.৫০'), 15050n);
  });

  it('converts Paisa (BigInt) to Taka float correctly', () => {
    assert.strictEqual(paisaToTaka(10000n), 100);
    assert.strictEqual(paisaToTaka(15050n), 150.5);
    assert.strictEqual(paisaToTaka('15050'), 150.5);
    assert.strictEqual(paisaToTaka(0n), 0);
  });

  it('formats South Asian numbers correctly (Lakhs & Crores)', () => {
    assert.strictEqual(formatSouthAsian(100), '100');
    assert.strictEqual(formatSouthAsian(1000), '1,000');
    assert.strictEqual(formatSouthAsian(100000), '1,00,000');
    assert.strictEqual(formatSouthAsian(1234567.5), '12,34,567.50');
    assert.strictEqual(formatSouthAsian(-5000), '-5,000');
  });

  it('translates digits between English and Bengali', () => {
    assert.strictEqual(toBengaliDigits(1234567890), '১২৩৪৫৬৭৮৯০');
    assert.strictEqual(toEnglishDigits('১২৩৪৫৬৭৮৯০'), '1234567890');
  });

  it('formats money for display with symbol and signs', () => {
    assert.strictEqual(formatMoney(15050n), '৳১৫০.৫০');
    assert.strictEqual(formatMoney(15050n, { showSign: true }), '+৳১৫০.৫০');
    assert.strictEqual(formatMoney(-5000n, { showSign: true }), '-৳৫০');
    assert.strictEqual(formatMoney(10000000n), '৳১,০০,০০০');
  });
});
