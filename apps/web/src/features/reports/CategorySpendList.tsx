import React from 'react';
import type { ReportCategory } from '@hisab/shared';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { interpolate } from '@/i18n/interpolate';
import { fillSlots } from '@/lib/fill-slots';
import { Money } from '@/components/Money';
import { CategoryChip } from '@/components/CategoryChip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategorySpendListProps {
  categories: ReportCategory[];
}

/** Budget comparison text for one category, or null when it had no budget. */
const BudgetNote: React.FC<{ category: ReportCategory }> = ({ category }) => {
  const { t, formatNumber } = useLanguage();
  if (!category.budget || !category.budgetSpent) return null;
  const budget = BigInt(category.budget);
  const spent = BigInt(category.budgetSpent);
  if (budget <= 0n) return null;

  const pct = Math.round(Number((spent * 100n) / budget));
  if (spent > budget) {
    return (
      <span className="inline-flex items-center gap-1 text-destructive font-medium">
        <AlertCircle className="h-3 w-3" />
        {fillSlots(t.reports.overBudgetBy, { amount: <Money amount={(spent - budget).toString()} /> })}
      </span>
    );
  }
  return <span>{interpolate(t.reports.ofBudget, { pct: formatNumber(pct) })}</span>;
};

export const CategorySpendList: React.FC<CategorySpendListProps> = ({ categories }) => {
  const { t, formatNumber } = useLanguage();
  const maxShare = Math.max(...categories.map((c) => c.share), 1);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg font-bold font-display">{t.reports.whereTitle}</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">{t.reports.whereSubtitle}</p>
      </CardHeader>
      <CardContent className="pt-0">
        {categories.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">{t.reports.noExpenseData}</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {categories.map((c) => (
              <li key={c.categoryId} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <CategoryChip label={c.shortLabel || c.name.slice(0, 1)} color={c.color || 1} size="sm" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-foreground">{c.name}</span>
                      <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                        <Money amount={c.total} />
                      </span>
                    </div>
                    {/* Share bar: identity colour of the category; length relative to the biggest */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(c.share / maxShare) * 100}%`, background: `var(--c${c.color || 1})` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>
                        <span className="font-semibold text-foreground">{formatNumber(Math.round(c.share))}%</span>
                        {' · '}
                        {interpolate(t.reports.txCountShort, { count: formatNumber(c.txCount) })}
                      </span>
                      <BudgetNote category={c} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
