import { isValidIsoDate } from './date';
import { toEnglishDigits } from './money';

export interface ParsedSmsResult {
  provider: 'bKash' | 'Nagad' | 'Rocket' | 'Bank' | 'Generic';
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date?: string; // YYYY-MM-DD
  counterparty?: string;
  trxId?: string;
  note: string;
}

/**
 * Parses date strings in formats like "08/11/2026", "08-11-2026", "2026-11-08", "08-Nov-2026"
 */
function parseDateString(rawDate: string): string | undefined {
  const normalized = rawDate.trim();

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    if (isValidIsoDate(iso)) return iso;
  }

  // Match YYYY-MM-DD
  const ymdMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    if (isValidIsoDate(ymdMatch[0])) return ymdMatch[0];
  }

  // Match DD-Mon-YYYY (e.g. 08-Nov-2026)
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const dMonYMatch = normalized.match(/^(\d{1,2})-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-(\d{4})/i);
  if (dMonYMatch) {
    const [, day, monStr, year] = dMonYMatch;
    const mon = monthNames[monStr.toLowerCase()];
    if (mon) {
      const iso = `${year}-${mon}-${day.padStart(2, '0')}`;
      if (isValidIsoDate(iso)) return iso;
    }
  }

  return undefined;
}

/**
 * Cleans and converts money string (e.g. "1,500.00" or "১৫০০.০০") to float number
 */
function parseAmount(rawAmount: string): number | null {
  const eng = toEnglishDigits(rawAmount).replace(/,/g, '').trim();
  const num = parseFloat(eng);
  return isNaN(num) || num <= 0 ? null : num;
}

/**
 * Intelligent SMS parser for bKash, Nagad, Rocket, Bangladeshi Bank SMS, and generic financial SMS.
 */
export function parseTransactionSms(smsText: string): ParsedSmsResult | null {
  if (!smsText || typeof smsText !== 'string') return null;

  const text = smsText.trim();
  if (text.length < 10) return null;

  // 1. Check for bKash
  // e.g. "You have received Tk 1,500.00 from 017XXXXXXXX. Ref Bonus. Fee Tk 0.00. Balance Tk 4,500.00. TrxID 9H7G6F5D at 08/11/2026 18:30"
  // e.g. "Payment Tk 450.00 to Shawarma House successful. Fee Tk 0.00. Balance Tk 4,970.50. TrxID 8L12M9Q1 at 08/11/2026 20:15"
  // e.g. "Cash Out Tk 2,000.00 to 019XXXXXXXX successful. Fee Tk 29.80. Balance Tk 2,120.20. TrxID 7J6H5G4F at 08/11/2026 12:00"
  // e.g. "Send Money Tk 500.00 to 018XXXXXXXX successful. Fee Tk 5.00. Balance Tk 1,615.20. TrxID 6F5D4S3A"
  if (/bKash|TrxID/i.test(text)) {
    const isReceived = /received Tk/i.test(text);
    const isPayment = /Payment Tk/i.test(text);
    const isCashOut = /Cash Out Tk/i.test(text);
    const isSendMoney = /Send Money Tk/i.test(text);

    const amountMatch = text.match(/(?:received|Payment|Cash Out|Send Money)\s+Tk\s*([\d,]+(?:\.\d+)?)/i);
    const amount = amountMatch ? parseAmount(amountMatch[1]) : null;

    if (amount) {
      const trxMatch = text.match(/TrxID\s+([A-Za-z0-9]+)/i);
      const trxId = trxMatch ? trxMatch[1] : undefined;

      const dateMatch = text.match(/at\s+(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i);
      const date = dateMatch ? parseDateString(dateMatch[1]) : undefined;

      let type: 'income' | 'expense' = 'expense';
      let counterparty = '';

      if (isReceived) {
        type = 'income';
        const fromMatch = text.match(/from\s+([^\.]+?)(?:\.|\s+Ref)/i);
        counterparty = fromMatch ? fromMatch[1].trim() : '';
      } else if (isPayment) {
        type = 'expense';
        const toMatch = text.match(/to\s+([^\.]+?)(?:\s+successful|\.|\s+Fee)/i);
        counterparty = toMatch ? toMatch[1].trim() : '';
      } else if (isCashOut) {
        type = 'expense';
        const toMatch = text.match(/to\s+([^\.]+?)(?:\s+successful|\.|\s+Fee)/i);
        counterparty = toMatch ? `Agent: ${toMatch[1].trim()}` : 'Agent Cash Out';
      } else if (isSendMoney) {
        type = 'expense';
        const toMatch = text.match(/to\s+([^\.]+?)(?:\s+successful|\.|\s+Fee)/i);
        counterparty = toMatch ? toMatch[1].trim() : '';
      }

      const noteParts: string[] = ['bKash'];
      if (isReceived) noteParts.push(`Received from ${counterparty || 'Sender'}`);
      else if (isPayment) noteParts.push(`Payment to ${counterparty || 'Merchant'}`);
      else if (isCashOut) noteParts.push(`Cash Out (${counterparty})`);
      else if (isSendMoney) noteParts.push(`Send Money to ${counterparty || 'Recipient'}`);
      if (trxId) noteParts.push(`(TrxID: ${trxId})`);

      return {
        provider: 'bKash',
        type,
        amount,
        date,
        counterparty: counterparty || undefined,
        trxId,
        note: noteParts.join(' '),
      };
    }
  }

  // 2. Check for Nagad
  // e.g. "Money Received. Amount: Tk 2,000.00 Sender: 017XXXXXXXX Ref: Salary TxnID: 71GF8432 Date: 08/11/2026 15:45"
  // e.g. "Payment: Amount: Tk 480.00 Merchant: Meena Bazar TxnID: 92KL4411 Date: 08/11/2026 19:20"
  // e.g. "Cash Out. Amount: Tk 1,000.00 Fee: Tk 15.00 Balance: Tk 3,500.00 TxnID: 88FF2211"
  if (/Nagad|TxnID/i.test(text)) {
    const isReceived = /Money Received/i.test(text);
    const isPayment = /Payment/i.test(text);
    const isCashOut = /Cash Out/i.test(text);

    const amountMatch = text.match(/Amount:\s*Tk\s*([\d,]+(?:\.\d+)?)/i);
    const amount = amountMatch ? parseAmount(amountMatch[1]) : null;

    if (amount) {
      const txnMatch = text.match(/TxnID:\s*([A-Za-z0-9]+)/i);
      const trxId = txnMatch ? txnMatch[1] : undefined;

      const dateMatch = text.match(/Date:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i);
      const date = dateMatch ? parseDateString(dateMatch[1]) : undefined;

      let type: 'income' | 'expense' = isReceived ? 'income' : 'expense';
      let counterparty = '';

      if (isReceived) {
        const senderMatch = text.match(/Sender:\s*([^\s]+)/i);
        counterparty = senderMatch ? senderMatch[1] : '';
      } else if (isPayment) {
        const merchantMatch = text.match(/Merchant:\s*([^T\n]+?)(?:\s+TxnID|\n|$)/i);
        counterparty = merchantMatch ? merchantMatch[1].trim() : '';
      }

      const noteParts: string[] = ['Nagad'];
      if (isReceived) noteParts.push(`Received from ${counterparty || 'Sender'}`);
      else if (isPayment) noteParts.push(`Payment to ${counterparty || 'Merchant'}`);
      else if (isCashOut) noteParts.push('Cash Out');
      if (trxId) noteParts.push(`(TxnID: ${trxId})`);

      return {
        provider: 'Nagad',
        type,
        amount,
        date,
        counterparty: counterparty || undefined,
        trxId,
        note: noteParts.join(' '),
      };
    }
  }

  // 3. Check for Rocket
  // e.g. "Cash In Tk 3,000.00 from 019XXXXXXXX to A/C 017XXXXXXXXX. Fee Tk 0.00. Balance Tk 6,200.00. Txn: 554433 Date: 08/11/2026"
  if (/Rocket|DBBL/i.test(text) || (/Cash In Tk/i.test(text) && /Txn:/i.test(text))) {
    const isReceived = /Cash In/i.test(text);
    const amountMatch = text.match(/Tk\s*([\d,]+(?:\.\d+)?)/i);
    const amount = amountMatch ? parseAmount(amountMatch[1]) : null;

    if (amount) {
      const txnMatch = text.match(/Txn:\s*([A-Za-z0-9]+)/i);
      const trxId = txnMatch ? txnMatch[1] : undefined;
      const dateMatch = text.match(/Date:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i);
      const date = dateMatch ? parseDateString(dateMatch[1]) : undefined;

      return {
        provider: 'Rocket',
        type: isReceived ? 'income' : 'expense',
        amount,
        date,
        trxId,
        note: `Rocket ${isReceived ? 'Cash In' : 'Payment'}${trxId ? ` (Txn: ${trxId})` : ''}`,
      };
    }
  }

  // 4. Check for Bangladeshi Bank SMS (City Bank, BRAC Bank, Dutch Bangla, EBL, etc.)
  // e.g. "Your A/C ending with 4321 has been debited by BDT 2,450.00 on 08-11-2026 14:22:10 at Aarong."
  // e.g. "Your A/C ending with 4321 has been credited by BDT 50,000.00 on 08-11-2026 by Monthly Salary."
  if (/debited|credited|ac\s+ending|a\/c|BDT/i.test(text)) {
    const isCredit = /credited/i.test(text);
    const isDebit = /debited/i.test(text);

    const amountMatch = text.match(/(?:BDT|Tk)\s*([\d,]+(?:\.\d+)?)/i);
    const amount = amountMatch ? parseAmount(amountMatch[1]) : null;

    if (amount && (isCredit || isDebit)) {
      const dateMatch = text.match(/on\s+(\d{1,2}[/-](?:\d{1,2}|[A-Za-z]{3})[/-]\d{4})/i);
      const date = dateMatch ? parseDateString(dateMatch[1]) : undefined;

      const acMatch = text.match(/(?:A\/C|ac)\s+(?:ending\s+with\s+|ending\s+)?(\d{3,6})/i);
      const acEnding = acMatch ? acMatch[1] : '';

      let counterparty = '';
      const atMatch = text.match(/at\s+([^.]+?)(?:\.|\s+Avail|$)/i);
      if (atMatch) {
        counterparty = atMatch[1].trim();
      } else {
        const matches = [...text.matchAll(/(?:from|by)\s+([^.]+?)(?:\.|\s+Avail|$)/gi)];
        for (const m of matches) {
          const val = m[1].trim();
          if (!/BDT|Tk|\d{4}/i.test(val)) {
            counterparty = val;
            break;
          }
        }
      }

      const noteParts: string[] = ['Bank'];
      if (isDebit) noteParts.push(`Debit at ${counterparty || 'POS/ATM'}`);
      else noteParts.push(`Credit from ${counterparty || 'Deposit/Transfer'}`);
      if (acEnding) noteParts.push(`(A/C: *${acEnding})`);

      return {
        provider: 'Bank',
        type: isCredit ? 'income' : 'expense',
        amount,
        date,
        counterparty: counterparty || undefined,
        note: noteParts.join(' '),
      };
    }
  }

  // 5. Generic fallback for any SMS with Tk / BDT and clear amount
  const genericAmtMatch = text.match(/(?:Tk|BDT|টাকা)\s*([\d,]+(?:\.\d+)?)/i);
  if (genericAmtMatch) {
    const amount = parseAmount(genericAmtMatch[1]);
    if (amount) {
      const isIncome = /received|credited|deposit|জমা|পাওয়া/i.test(text);
      return {
        provider: 'Generic',
        type: isIncome ? 'income' : 'expense',
        amount,
        note: text.slice(0, 60),
      };
    }
  }

  return null;
}
