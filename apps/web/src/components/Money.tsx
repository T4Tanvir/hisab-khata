import React from 'react';
import { formatMoney, type FormatMoneyOptions } from '@hisab/shared';

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
  bengaliDigits = true,
}) => {
  const formatted = formatMoney(amount, { showSymbol, showSign, bengaliDigits });
  const colorClass =
    type === 'income' ? 'text-pos' : type === 'expense' ? 'text-neg' : '';

  return <span className={`money-text ${colorClass} ${className}`.trim()}>{formatted}</span>;
};

