import React from 'react';
import type { ReportOverview } from '@hisab/shared';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { interpolate } from '@/i18n/interpolate';
import { Money } from '@/components/Money';
import { Card, CardContent } from '@/components/ui/card';

interface ReportSummaryTilesProps {
  overview: ReportOverview;
}

/** % change from `prev` to `curr` (paisa strings); null when there is nothing to compare. */
function percentChange(curr: string, prev: string): number | null {
  const c = BigInt(curr);
  const p = BigInt(prev);
  if (p === 0n) return null;
  const diff = c - p;
  const abs = p < 0n ? -p : p;
  return Math.round(Number((diff * 1000n) / abs)) / 10;
}

/**
 * Change vs the previous period. `upIsGood` decides the colour: more income is good,
 * more spending is bad. Always shown with an arrow icon + text, never colour alone.
 */
const Delta: React.FC<{ change: number | null; upIsGood: boolean; compareLabel: string }> = ({
  change,
  upIsGood,
  compareLabel,
}) => {
  const { t, formatNumber } = useLanguage();
  if (change === null) {
    return <p className="text-xs text-muted-foreground">{t.reports.deltaNoPrev}</p>;
  }
  if (Math.abs(change) < 0.5) {
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
        {t.reports.deltaSame} · {compareLabel}
      </p>
    );
  }
  const up = change > 0;
  const good = up === upIsGood;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${good ? 'text-pos' : 'text-neg'}`}>
        <Icon className="h-3.5 w-3.5" />
        {formatNumber(Math.abs(Math.round(change)))}%
      </span>
      <span className="truncate">{compareLabel}</span>
    </p>
  );
};

export const ReportSummaryTiles: React.FC<ReportSummaryTilesProps> = ({ overview }) => {
  const { t, formatNumber } = useLanguage();
  const { totals, previous, months } = overview;

  const compareLabel =
    months.length === 1
      ? t.reports.deltaVsPrevMonth
      : interpolate(t.reports.deltaVsPrev, { count: formatNumber(months.length) });

  const savingsNegative = BigInt(totals.savings) < 0n;
  const runningOnly = totals.avgMonthsCount === 1 && totals.endMonth === overview.currentMonth && months.length === 1;

  const tiles = [
    {
      label: t.reports.kpiIncome,
      value: <Money amount={totals.income} />,
      sub: <Delta change={percentChange(totals.income, previous.income)} upIsGood compareLabel={compareLabel} />,
    },
    {
      label: t.reports.kpiExpense,
      value: <Money amount={totals.expense} />,
      sub: <Delta change={percentChange(totals.expense, previous.expense)} upIsGood={false} compareLabel={compareLabel} />,
    },
    {
      label: t.reports.kpiSavings,
      value: <Money amount={totals.savings} className={savingsNegative ? 'text-neg' : ''} />,
      sub: (
        <p className="text-xs text-muted-foreground">
          {totals.savingsRate === null
            ? t.reports.kpiNoIncome
            : interpolate(t.reports.kpiSavingsRate, { pct: formatNumber(Math.round(totals.savingsRate)) })}
        </p>
      ),
    },
    {
      label: t.reports.kpiAvgExpense,
      value: <Money amount={totals.avgMonthlyExpense} />,
      sub: (
        <p className="text-xs text-muted-foreground">
          {runningOnly
            ? t.reports.kpiAvgBasisRunning
            : interpolate(t.reports.kpiAvgBasis, { count: formatNumber(totals.avgMonthsCount) })}
        </p>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="border-border/60">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
            <p className="font-display font-semibold text-2xl tracking-tight text-foreground">{tile.value}</p>
            {tile.sub}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
