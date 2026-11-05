const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function toBengaliDigits(input: string | number | bigint): string {
  const str = input.toString();
  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

export function toEnglishDigits(input: string): string {
  let result = input;
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(BENGALI_DIGITS[i], ENGLISH_DIGITS[i]);
  }
  return result;
}

/**
 * Converts Taka (e.g. 150.5 or "150.50") to Paisa BigInt (15050n).
 */
export function takaToPaisa(amount: number | string): bigint {
  const normalized = typeof amount === 'string' ? toEnglishDigits(amount.trim()) : amount.toString();
  const num = parseFloat(normalized);
  if (isNaN(num)) {
    throw new Error('Invalid money amount');
  }
  return BigInt(Math.round(num * 100));
}

/**
 * Converts Paisa BigInt (15050n) to Taka float (150.50).
 */
export function paisaToTaka(paisa: bigint | number | string): number {
  const p = typeof paisa === 'bigint' ? Number(paisa) : Number(paisa);
  return p / 100;
}

/**
 * Formats a number using South Asian numbering (e.g. 12,34,567.89).
 */
export function formatSouthAsian(num: number): string {
  const parts = num.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  const isNegative = integerPart.startsWith('-');
  if (isNegative) {
    integerPart = integerPart.slice(1);
  }

  let formatted = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.slice(-3);
    const rest = integerPart.slice(0, -3);
    const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formatted = `${restFormatted},${lastThree}`;
  } else {
    formatted = integerPart;
  }

  // Omit .00 if decimal is 0
  const dec = decimalPart === '00' ? '' : `.${decimalPart}`;
  return `${isNegative ? '-' : ''}${formatted}${dec}`;
}

export interface FormatMoneyOptions {
  showSymbol?: boolean;
  showSign?: boolean;
  bengaliDigits?: boolean;
}

/**
 * Formats Paisa into display string (e.g. "৳ ১,২৩,৪৫০" or "+৳ ৫০").
 */
export function formatMoney(paisa: bigint | number | string, options: FormatMoneyOptions = {}): string {
  const { showSymbol = true, showSign = false, bengaliDigits = true } = options;
  const p = typeof paisa === 'bigint' ? paisa : BigInt(paisa);
  const isNegative = p < 0n;
  const absP = isNegative ? -p : p;
  const taka = Number(absP) / 100;

  const southAsianStr = formatSouthAsian(taka);
  const finalDigits = bengaliDigits ? toBengaliDigits(southAsianStr) : southAsianStr;

  const sign = isNegative ? '-' : showSign && p > 0n ? '+' : '';
  const symbol = showSymbol ? '৳' : '';

  return `${sign}${symbol}${finalDigits}`.trim();
}

