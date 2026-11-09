import { toBengaliDigits } from '@hisab/shared';

/**
 * Short money label for chart axes / tight spaces, in South-Asian units:
 * 1,20,000 → "৳১.২ লাখ" (bn) / "৳1.2 lakh" (en); 45,720 → "৳৪৫.৭ হাজার" / "৳45.7k".
 * Input is paisa (string | bigint | number).
 */
export function formatCompactTaka(paisa: string | bigint | number, language: 'bn' | 'en'): string {
  const taka = Number(paisa) / 100;
  const abs = Math.abs(taka);
  const sign = taka < 0 ? '-' : '';

  const units: Array<[number, string, string]> = [
    [1e7, ' কোটি', ' crore'],
    [1e5, ' লাখ', ' lakh'],
    [1e3, ' হাজার', 'k'],
  ];

  let text = String(Math.round(abs));
  for (const [size, bn, en] of units) {
    if (abs >= size) {
      const value = Math.round((abs / size) * 10) / 10;
      text = `${String(value)}${language === 'bn' ? bn : en}`;
      break;
    }
  }

  const out = `${sign}৳${text}`;
  return language === 'bn' ? toBengaliDigits(out) : out;
}
