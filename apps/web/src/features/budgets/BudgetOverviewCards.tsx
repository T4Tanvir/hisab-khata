import React from 'react';
import type { BudgetSummary } from './api';
import { toBengaliDigits } from '@hisab/shared';
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
                মোট বাজেট সীমা
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">হিসাব হচ্ছে...</span>
                ) : (
                  <Money amount={summary?.totalBudget || '0'} showSign={false} />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {toBengaliDigits(summary?.budgetedCategoriesCount || 0)} টি খাতে বাজেট নির্ধারিত
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
                বাজেটভুক্ত খাতে খরচ
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neg">
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">হিসাব হচ্ছে...</span>
                ) : (
                  <Money amount={summary?.totalSpent || '0'} showSign={false} />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                মোট বাজেটের {toBengaliDigits(summary?.percentage || 0)}% খরচ হয়েছে
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
                {isOverBudget ? 'বাজেট অতিরিক্ত খরচ' : 'অবশিষ্ট বাজেট'}
              </p>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  isOverBudget ? 'text-destructive' : 'text-pos'
                }`}
              >
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">হিসাব হচ্ছে...</span>
                ) : (
                  <Money
                    amount={isOverBudget ? (totalSpent - totalBudget).toString() : remainingBudget.toString()}
                    showSign={false}
                  />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isOverBudget
                  ? 'বাজেটের চেয়ে বেশি খরচ হয়েছে'
                  : 'খরচ করার মতো অবশিষ্ট আছে'}
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
                  চলতি মাসের সামগ্রিক বাজেট অগ্রগতি
                </span>
                {isOverBudget ? (
                  <Badge variant="destructive" className="gap-1 text-[11px]">
                    <AlertCircle className="h-3 w-3" />
                    বাজেট অতিক্রম করেছে
                  </Badge>
                ) : isNearLimit ? (
                  <Badge
                    variant="outline"
                    className="gap-1 text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  >
                    সতর্কতা সীমা
                  </Badge>
                ) : (
                  <Badge variant="pos" className="gap-1 text-[11px]">
                    <CheckCircle2 className="h-3 w-3" />
                    বাজেট নিয়ন্ত্রণে আছে
                  </Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground font-mono">
                {toBengaliDigits(summary?.percentage || 0)}% ব্যবহৃত
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
              <span>খরচ: <Money amount={summary?.totalSpent || '0'} /></span>
              <span>মোট বাজেট: <Money amount={summary?.totalBudget || '0'} /></span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
