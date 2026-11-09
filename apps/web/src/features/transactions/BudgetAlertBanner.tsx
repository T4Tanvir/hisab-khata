import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { BudgetAlert } from './api';
import { useLanguage } from '@/hooks/useLanguage';
import { localizeDefaultNamesInText } from '@/lib/default-names';
import { interpolate } from '@/i18n/interpolate';

interface BudgetAlertBannerProps {
  alert: BudgetAlert;
  onDismiss: () => void;
}

/** Page-level warning shown after saving an expense that pushes a category near/over its budget. */
export const BudgetAlertBanner: React.FC<BudgetAlertBannerProps> = ({ alert, onDismiss }) => {
  const { t, formatNumber, language } = useLanguage();
  const categoryName = language === 'en' ? localizeDefaultNamesInText(alert.categoryName) : alert.categoryName;
  return (
  <div
    role="alert"
    className={`flex items-start justify-between p-4 rounded-xl border shadow-sm transition-all ${
      alert.status === 'exceeded'
        ? 'bg-destructive/10 text-destructive border-destructive/20'
        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
    }`}
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-sm">
          {interpolate(
            alert.status === 'exceeded' ? t.transactions.budgetExceededMsg : t.transactions.budgetWarningMsg,
            { category: categoryName, pct: formatNumber(Math.round(alert.percentage)) }
          )}
        </p>
        <p className="text-xs mt-0.5 opacity-90">
          {interpolate(t.transactions.alertDetails, {
            category: categoryName,
            pct: formatNumber(Math.round(alert.percentage)),
          })}
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={onDismiss}
      className="text-xs font-semibold px-2 py-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
    >
      {t.common.close}
    </button>
  </div>
  );
};
