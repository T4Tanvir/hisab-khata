import React from 'react';
import type { BudgetSummary } from './api';
import { useLanguage } from '@/hooks/useLanguage';
import { interpolate } from '@/i18n/interpolate';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/Money';
import { Target, PieChart, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetOverviewCardsProps {
  summary?: BudgetSummary;
  isLoading?: boolean;
}

export const BudgetOverviewCards: React.FC<BudgetOverviewCardsProps> = ({
  summary,
  isLoading,
}) => {
  const { t, formatNumber } = useLanguage();
  const pct = formatNumber(summary?.percentage || 0);
  const totalBudget = BigInt(summary?.totalBudget || '0');
  const totalSpent = BigInt(summary?.totalSpent || '0');
  const isOverBudget = summary?.percentage !== undefined && summary.percentage >= 100;
  const isNearLimit = summary?.percentage !== undefined && summary.percentage >= 80 && summary.percentage < 100;
  const remainingBudget = totalBudget - totalSpent;

  const progressPercent = Math.min(summary?.percentage || 0, 100);

  return (
    <div className="space-y-4">
      {/* ৩টি সারাংশ কার্ড */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* মোট বাজেট */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.budgets.totalLimit}
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">{t.common.calculating}</span>
                ) : (
                  <Money amount={summary?.totalBudget || '0'} showSign={false} />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {interpolate(t.budgets.budgetedCount, {
                  count: formatNumber(summary?.budgetedCategoriesCount || 0),
                })}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* মোট খরচ */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.budgets.spentInBudgeted}
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neg">
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">{t.common.calculating}</span>
                ) : (
                  <Money amount={summary?.totalSpent || '0'} showSign={false} />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {interpolate(t.budgets.spentPctOfTotal, { pct })}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neg/10 text-neg">
              <PieChart className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* অবশিষ্ট বাজেট */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isOverBudget ? t.budgets.overBudgetSpent : t.budgets.remainingBudget}
              </p>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  isOverBudget ? 'text-destructive' : 'text-pos'
                }`}
              >
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">{t.common.calculating}</span>
                ) : (
                  <Money
                    amount={isOverBudget ? (totalSpent - totalBudget).toString() : remainingBudget.toString()}
                    showSign={false}
                  />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isOverBudget ? t.budgets.overBudgetHint : t.budgets.remainingHint}
              </p>
            </div>
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                isOverBudget ? 'bg-destructive/10 text-destructive' : 'bg-pos/10 text-pos'
              }`}
            >
              <Wallet className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* সামগ্রিক বাজেট প্রগ্রেস বার ও সতর্কবার্তা কার্ড */}
      {totalBudget > 0n && (
        <Card className="p-4 sm:p-5 border-border/60">
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {t.budgets.overallProgress}
                </span>
                {isOverBudget ? (
                  <Badge variant="destructive" className="gap-1 text-[11px]">
                    <AlertCircle className="h-3 w-3" />
                    {t.budgets.exceeded}
                  </Badge>
                ) : isNearLimit ? (
                  <Badge
                    variant="outline"
                    className="gap-1 text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  >
                    {t.budgets.nearLimit}
                  </Badge>
                ) : (
                  <Badge variant="pos" className="gap-1 text-[11px]">
                    <CheckCircle2 className="h-3 w-3" />
                    {t.budgets.underControl}
                  </Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground font-mono">
                {interpolate(t.budgets.usedPct, { pct })}
              </div>
            </div>

            <div className="w-full bg-muted/60 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget
                    ? 'bg-destructive'
                    : isNearLimit
                    ? 'bg-amber-500'
                    : 'bg-pos'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t.budgets.spentPrefix} <Money amount={summary?.totalSpent || '0'} /></span>
              <span>{t.budgets.totalBudgetPrefix} <Money amount={summary?.totalBudget || '0'} /></span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
