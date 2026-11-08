import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseTransactionSms } from '../sms-parser';

describe('SMS Transaction Parser (@hisab/shared)', () => {
  it('parses bKash Received SMS (Income)', () => {
    const sms = 'You have received Tk 1,500.00 from 01712345678. Ref Bonus. Fee Tk 0.00. Balance Tk 4,500.00. TrxID 9H7G6F5D at 08/11/2026 18:30';
    const result = parseTransactionSms(sms);

    assert.ok(result);
    assert.strictEqual(result.provider, 'bKash');
    assert.strictEqual(result.type, 'income');
    assert.strictEqual(result.amount, 1500);
    assert.strictEqual(result.date, '2026-11-08');
    assert.strictEqual(result.trxId, '9H7G6F5D');
    assert.strictEqual(result.counterparty, '01712345678');
    assert.match(result.note, /9H7G6F5D/);
  });

  it('parses bKash Merchant Payment SMS (Expense)', () => {
    const sms = 'Payment Tk 450.00 to Shawarma House successful. Fee Tk 0.00. Balance Tk 4,970.50. TrxID 8L12M9Q1 at 08/11/2026 20:15';
    const result = parseTransactionSms(sms);

    assert.ok(result);
    assert.strictEqual(result.provider, 'bKash');
    assert.strictEqual(result.type, 'expense');
    assert.strictEqual(result.amount, 450);
    assert.strictEqual(result.counterparty, 'Shawarma House');
    assert.strictEqual(result.trxId, '8L12M9Q1');
  });

  it('parses bKash Cash Out SMS (Expense)', () => {
    const sms = 'Cash Out Tk 2,000.00 to 01987654321 successful. Fee Tk 29.80. Balance Tk 2,120.20. TrxID 7J6H5G4F at 08/11/2026 12:00';
    const result = parseTransactionSms(sms);

    assert.ok(result);
    assert.strictEqual(result.provider, 'bKash');
    assert.strictEqual(result.type, 'expense');
    assert.strictEqual(result.amount, 2000);
    assert.strictEqual(result.trxId, '7J6H5G4F');
  });

  it('parses Nagad Payment SMS (Expense)', () => {
    const sms = 'Payment: Amount: Tk 480.00 Merchant: Meena Bazar TxnID: 92KL4411 Date: 08/11/2026 19:20';
    const result = parseTransactionSms(sms);

    assert.ok(result);
    assert.strictEqual(result.provider, 'Nagad');
    assert.strictEqual(result.type, 'expense');
    assert.strictEqual(result.amount, 480);
    assert.strictEqual(result.counterparty, 'Meena Bazar');
    assert.strictEqual(result.trxId, '92KL4411');
  });

  it('parses Nagad Money Received SMS (Income)', () => {
    const sms = 'Money Received. Amount: Tk 2,500.00 Sender: 01711223344 Ref: Salary TxnID: 71GF8432 Date: 08/11/2026 15:45';
    const result = parseTransactionSms(sms);

    assert.ok(result);
    assert.strictEqual(result.provider, 'Nagad');
    assert.strictEqual(result.type, 'income');
    assert.strictEqual(result.amount, 2500);
    assert.strictEqual(result.counterparty, '01711223344');
  });

  it('parses Bangladeshi Bank Debit SMS (Expense)', () => {
    const sms = 'Your A/C ending with 4321 has been debited by BDT 2,450.00 on 08-Nov-2026 14:22:10 at Aarong. Avail Bal: BDT 45,210.00';
    const result = parseTransactionSms(sms);

    assert.ok(result);
    assert.strictEqual(result.provider, 'Bank');
    assert.strictEqual(result.type, 'expense');
    assert.strictEqual(result.amount, 2450);
    assert.strictEqual(result.date, '2026-11-08');
    assert.strictEqual(result.counterparty, 'Aarong');
    assert.match(result.note, /\*4321/);
  });

  it('parses Bangladeshi Bank Credit SMS (Income)', () => {
    const sms = 'Your A/C ending with 5544 has been credited by BDT 65,000.00 on 08-11-2026 by Monthly Salary. Avail Bal: BDT 95,210.00';
    const result = parseTransactionSms(sms);

    assert.ok(result);
    assert.strictEqual(result.provider, 'Bank');
    assert.strictEqual(result.type, 'income');
    assert.strictEqual(result.amount, 65000);
    assert.strictEqual(result.counterparty, 'Monthly Salary');
  });

  it('returns null for unrelated text', () => {
    assert.strictEqual(parseTransactionSms('Hello how are you?'), null);
    assert.strictEqual(parseTransactionSms(''), null);
  });
});
