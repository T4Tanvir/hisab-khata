import React from 'react';
import { getDhakaDate, type Budget } from '@hisab/shared';
import { useLanguage } from '@/hooks/useLanguage';
import { interpolate } from '@/i18n/interpolate';
import { fillSlots } from '@/lib/fill-slots';
import { Money } from '@/components/Money';
import { CategoryChip } from '@/components/CategoryChip';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, AlertTriangle, Check, AlertCircle, Plus } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
}

type Tone = 'ok' | 'warn' | 'over' | 'done' | 'none';

/** How far through the budget's month we are (Asia/Dhaka), for the pace marker and daily allowance. */
function monthProgress(month: string) {
  const today = getDhakaDate();
  if (today.slice(0, 7) !== month) return null; // past / future month: no pace
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const day = Number(today.slice(8, 10));
  return { pacePercent: (day / daysInMonth) * 100, daysLeft: daysInMonth - day + 1 };
}

const PILL_STYLES: Record<Tone, string> = {
  ok: 'bg-muted text-foreground [&_svg]:text-pos',
  warn: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  over: 'bg-destructive/15 text-destructive',
  done: 'bg-muted text-muted-foreground',
  none: 'bg-muted/60 text-muted-foreground',
};

const METER_FILL: Record<Tone, string> = {
  ok: 'bg-foreground/55',
  warn: 'bg-amber-500',
  over: 'bg-destructive',
  done: 'bg-foreground/35',
  none: 'bg-transparent',
};

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit }) => {
  const { t, formatNumber } = useLanguage();

  const limit = BigInt(budget.amount || '0');
  const spent = BigInt(budget.spentAmount || '0');
  const hasBudget = limit > 0n;
  const remaining = limit - spent;

  const tone: Tone = !hasBudget
    ? 'none'
    : budget.status === 'exceeded' && remaining < 0n
      ? 'over'
      : remaining === 0n
        ? 'done'
        : budget.status === 'warning'
          ? 'warn'
          : 'ok';

  const progress = monthProgress(budget.month);
  // Daily allowance for the rest of the month, rounded down to whole taka
  const perDay =
    progress && remaining > 0n ? (remaining / BigInt(progress.daysLeft) / 100n) * 100n : null;
  const fillPercent = Math.min(budget.percentage || 0, 100);
  const name = budget.categoryName || t.budgets.categoryFallback;

  const pill = {
    ok: { icon: <Check className="h-3.5 w-3.5" strokeWidth={2.6} />, label: t.budgets.cardPillOk },
    warn: { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: t.budgets.cardPillWarn },
    over: { icon: <AlertCircle className="h-3.5 w-3.5" />, label: t.budgets.cardPillOver },
    done: { icon: <Check className="h-3.5 w-3.5" strokeWidth={2.6} />, label: t.budgets.cardPillDone },
    none: { icon: null, label: t.budgets.cardPillNone },
  }[tone];

  return (
    <Card
      className={`border-border/60 transition-colors hover:border-border ${
        tone === 'none' ? 'bg-card/60' : ''
      } ${tone === 'over' ? 'border-destructive/40' : ''}`}
    >
      <CardContent className="p-4 sm:p-5 flex flex-col gap-3.5 h-full">
        {/* Header: category chip, name, status pill, edit */}
        <div className="flex items-center gap-2.5">
          <CategoryChip
            label={budget.categoryShortLabel || name.slice(0, 1)}
            color={budget.categoryColor || 1}
            className="shrink-0"
          />
          <h3 className="flex-1 min-w-0 font-display font-semibold text-[15px] text-foreground truncate">
            {name}
          </h3>
          <span
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PILL_STYLES[tone]}`}
          >
            {pill.icon}
            {pill.label}
          </span>
          {hasBudget && (
            <button
              type="button"
              onClick={() => onEdit(budget)}
              title={t.budgets.editLimitTitle}
              aria-label={`${t.budgets.editLimitTitle}: ${name}`}
              className="h-7 w-7 -mr-1 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {hasBudget ? (
          <>
            {/* Headline number: what is left (or how much over) */}
            <p className="font-display font-semibold text-2xl leading-tight tracking-tight">
              <Money
                amount={(remaining < 0n ? -remaining : remaining).toString()}
                className={tone === 'over' ? 'text-destructive' : 'text-foreground'}
              />{' '}
              <span className="font-sans text-xs font-normal text-muted-foreground">
                {tone === 'over' ? t.budgets.cardOver : t.budgets.cardLeft}
              </span>
            </p>

            {/* Meter with month-pace marker */}
            <div
              className="relative h-2 rounded-full bg-muted"
              role="img"
              aria-label={interpolate(t.budgets.cardMeterLabel, {
                category: name,
                pct: formatNumber(budget.percentage),
              })}
            >
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ${METER_FILL[tone]}`}
                style={{ width: `${fillPercent}%` }}
              />
              {progress && tone !== 'done' && tone !== 'over' && (
                <span
                  className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground ring-2 ring-card"
                  style={{ left: `${progress.pacePercent}%` }}
                  title={t.budgets.cardPaceHint}
                />
              )}
            </div>

            {/* Footer: spent of limit, daily allowance for the rest of the month */}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {fillSlots(t.budgets.cardSpentOf, {
                  spent: <Money amount={budget.spentAmount} className="text-foreground font-medium" />,
                  limit: <Money amount={budget.amount} />,
                })}
              </span>
              {perDay !== null && (
                <span className="tabular-nums">
                  {fillSlots(t.budgets.cardPerDay, {
                    amount: <Money amount={perDay.toString()} className="text-foreground font-medium" />,
                  })}
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {spent > 0n ? (
                fillSlots(t.budgets.cardSpentThisMonth, {
                  amount: <Money amount={budget.spentAmount} className="text-foreground font-medium" />,
                })
              ) : (
                t.budgets.cardNoSpend
              )}
            </p>
            <button
              type="button"
              onClick={() => onEdit(budget)}
              className="mt-auto w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {t.budgets.cardSetLimitCta}
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
