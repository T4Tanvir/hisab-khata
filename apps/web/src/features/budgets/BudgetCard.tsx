import React from 'react';
import type { Budget } from '@hisab/shared';
import { toBengaliDigits } from '@hisab/shared';
import { Money } from '@/components/Money';
import { CategoryChip } from '@/components/CategoryChip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, AlertTriangle, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit }) => {
  const hasBudget = BigInt(budget.amount || '0') > 0n;
  const isExceeded = budget.status === 'exceeded';
  const isWarning = budget.status === 'warning';

  const progressPercent = Math.min(budget.percentage || 0, 100);

  return (
    <Card className="border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* উপরের সারি: ক্যাটাগরি নাম, চিপ ও স্ট্যাটাস */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: `var(--c${budget.categoryColor || 1})` }}
            />
            <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
              {budget.categoryName || 'ক্যাটাগরি'}
            </h4>
            {budget.categoryShortLabel && (
              <CategoryChip
                label={budget.categoryShortLabel}
                color={budget.categoryColor || 1}
                size="sm"
              />
            )}
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {!hasBudget ? (
              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                বাজেট নির্ধারিত নেই
              </Badge>
            ) : isExceeded ? (
              <Badge variant="destructive" className="gap-1 text-[11px]">
                <AlertCircle className="h-3 w-3" />
                অতিক্রম ({toBengaliDigits(budget.percentage)}%)
              </Badge>
            ) : isWarning ? (
              <Badge
                variant="outline"
                className="gap-1 text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold"
              >
                <AlertTriangle className="h-3 w-3" />
                সতর্কতা ({toBengaliDigits(budget.percentage)}%)
              </Badge>
            ) : (
              <Badge variant="pos" className="gap-1 text-[11px]">
                <CheckCircle2 className="h-3 w-3" />
                নিয়ন্ত্রণে ({toBengaliDigits(budget.percentage)}%)
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(budget)}
              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              title={hasBudget ? 'বাজেট পরিবর্তন করুন' : 'বাজেট নির্ধারণ করুন'}
            >
              {hasBudget ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* মাঝের সারি: প্রগ্রেস বার */}
        {hasBudget ? (
          <div className="space-y-1.5">
            <div className="w-full bg-muted/60 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isExceeded
                    ? 'bg-destructive'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-pos'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-muted/30 border border-dashed border-border/80 text-xs text-muted-foreground flex items-center justify-between">
            <span>এই খাতে এখনও বাজেট সীমা দেওয়া হয়নি।</span>
            <button
              type="button"
              onClick={() => onEdit(budget)}
              className="font-semibold text-primary hover:underline ml-2 shrink-0"
            >
              সীমা দিন
            </button>
          </div>
        )}

        {/* নিচের সারি: টাকার হিসাবসমূহ */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">বাজেট সীমা</span>
            <span className="font-semibold font-mono text-foreground text-xs sm:text-sm">
              {hasBudget ? <Money amount={budget.amount} /> : '—'}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px]">মোট খরচ</span>
            <span
              className={`font-semibold font-mono text-xs sm:text-sm ${
                isExceeded ? 'text-neg' : 'text-foreground'
              }`}
            >
              <Money amount={budget.spentAmount} />
            </span>
          </div>

          <div className="text-right">
            <span className="text-muted-foreground block text-[11px]">
              {isExceeded ? 'অতিরিক্ত খরচ' : 'অবশিষ্ট বাজেট'}
            </span>
            <span
              className={`font-semibold font-mono text-xs sm:text-sm ${
                isExceeded ? 'text-destructive font-bold' : 'text-pos'
              }`}
            >
              {hasBudget ? (
                <Money
                  amount={
                    isExceeded
                      ? (
                          BigInt(budget.spentAmount) - BigInt(budget.amount)
                        ).toString()
                      : budget.remainingAmount || '0'
                  }
                  showSign={false}
                />
              ) : (
                '—'
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
