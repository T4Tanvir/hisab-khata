import React from 'react';
import type { Transaction } from '@hisab/shared';
import { useLanguage } from '@/hooks/useLanguage';
import { Money } from '@/components/Money';
import { CategoryChip } from '@/components/CategoryChip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopExpensesListProps {
  expenses: Transaction[];
}

export const TopExpensesList: React.FC<TopExpensesListProps> = ({ expenses }) => {
  const { t, formatDateStr } = useLanguage();

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg font-bold font-display">{t.reports.topTitle}</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">{t.reports.topSubtitle}</p>
      </CardHeader>
      <CardContent className="pt-0">
        {expenses.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">{t.reports.noExpenseData}</p>
        ) : (
          <ol className="divide-y divide-border/50">
            {expenses.map((tx) => {
              const category = tx.categoryName || t.transactions.uncategorized;
              return (
                <li key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <CategoryChip
                    label={tx.categoryShortLabel || category.slice(0, 1)}
                    color={tx.categoryColor || 9}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{tx.note || category}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {[category, tx.walletName, formatDateStr(tx.occurredOn)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    <Money amount={`-${tx.amount}`} />
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};
