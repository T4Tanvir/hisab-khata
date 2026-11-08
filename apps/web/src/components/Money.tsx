import React from 'react';
import { formatMoney, type FormatMoneyOptions } from '@hisab/shared';
import { useLanguage } from '../hooks/useLanguage';

interface MoneyProps extends FormatMoneyOptions {
  amount: bigint | number | string;
  className?: string;
  type?: 'income' | 'expense' | 'neutral';
}

export const Money: React.FC<MoneyProps> = ({
  amount,
  className = '',
  type = 'neutral',
  showSymbol = true,
  showSign = false,
  bengaliDigits,
}) => {
  let isBn = true;
  try {
    const lang = useLanguage();
    isBn = lang.language === 'bn';
  } catch {
    // fallback if used outside LanguageProvider
    isBn = true;
  }

  const useBengali = bengaliDigits !== undefined ? bengaliDigits : isBn;
  const formatted = formatMoney(amount, { showSymbol, showSign, bengaliDigits: useBengali });
  const colorClass =
    type === 'income' ? 'text-pos' : type === 'expense' ? 'text-neg' : '';

  return <span className={`money-text ${colorClass} ${className}`.trim()}>{formatted}</span>;
};

