import React, { useState } from 'react';
import { getDhakaMonth, REPORT_PERIODS, type ReportPeriod } from '@hisab/shared';
import { ChevronLeft, ChevronRight, Download, BarChart3 } from 'lucide-react';
import {
  useReportOverview,
  downloadExportCsv,
  ReportSummaryTiles,
  SavingsBarChart,
  CategorySpendList,
  CategoryMonthHeatmap,
  TopExpensesList,
  InsightsCard,
} from '@/features/reports';
import { useLanguage } from '@/hooks/useLanguage';
import { interpolate } from '@/i18n/interpolate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

/** First month of the period (mirrors the server's rule). */
function periodStart(period: ReportPeriod, end: string): string {
  return period === 'ytd' ? `${end.slice(0, 4)}-01` : addMonths(end, -(Number(period) - 1));
}

export const ReportsPage: React.FC = () => {
  const { t, formatMonthStr } = useLanguage();
  const currentMonth = getDhakaMonth();
  const [period, setPeriod] = useState<ReportPeriod>('6');
  const [endMonth, setEndMonth] = useState(currentMonth);

  const { data: overview, isLoading, isError, isPlaceholderData } = useReportOverview(period, endMonth);

  const start = periodStart(period, endMonth);
  const rangeLabel = (() => {
    if (start === endMonth) return formatMonthStr(endMonth);
    const [startName, startYear] = formatMonthStr(start).split(' ');
    const end = formatMonthStr(endMonth);
    return start.slice(0, 4) === endMonth.slice(0, 4) ? `${startName} – ${end}` : `${startName} ${startYear} – ${end}`;
  })();

  const periodLabels: Record<ReportPeriod, string> = {
    '1': t.reports.period1,
    '3': t.reports.period3,
    '6': t.reports.period6,
    '12': t.reports.period12,
    ytd: t.reports.periodYtd,
  };

  const hasData =
    !!overview &&
    (BigInt(overview.totals.income) > 0n || BigInt(overview.totals.expense) > 0n || overview.categories.length > 0);
  const multiMonth = (overview?.months.length ?? 0) >= 2;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.reports.pageKicker}</p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">{t.reports.pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {interpolate(t.reports.rangeSubtitle, { range: rangeLabel })}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => downloadExportCsv({ from: start, to: endMonth })}
          className="gap-2 h-10 shadow-sm self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          {t.reports.exportCsv}
        </Button>
      </div>

      {/* Controls: period + end month, one row above the content */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          role="radiogroup"
          aria-label={t.reports.periodLabel}
          className="grid grid-cols-5 md:inline-flex rounded-xl border bg-muted/40 p-1 gap-0.5"
        >
          {REPORT_PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={period === p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-2 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center self-start md:self-auto rounded-xl border bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setEndMonth(addMonths(endMonth, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors"
            title={t.reports.prevEndMonth}
            aria-label={t.reports.prevEndMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[150px] px-3 text-center text-sm font-bold font-display text-foreground select-none">
            {rangeLabel}
          </div>
          <button
            type="button"
            onClick={() => setEndMonth(addMonths(endMonth, 1))}
            disabled={endMonth >= currentMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title={t.reports.nextEndMonth}
            aria-label={t.reports.nextEndMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl border bg-card/60 animate-pulse" />
            ))}
          </div>
          <div className="h-80 rounded-xl border bg-card/60 animate-pulse" />
        </div>
      ) : isError || !overview ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">{t.reports.notEnoughData}</CardContent>
        </Card>
      ) : !hasData ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center space-y-2">
            <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm font-semibold text-foreground">{t.reports.emptyPeriod}</p>
            <p className="text-xs text-muted-foreground">{t.reports.emptyPeriodHint}</p>
          </CardContent>
        </Card>
      ) : (
        <div className={`space-y-6 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
          <ReportSummaryTiles overview={overview} />

          {multiMonth && <SavingsBarChart monthly={overview.monthly} currentMonth={overview.currentMonth} />}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <CategorySpendList categories={overview.categories} />
            </div>
            <div className="lg:col-span-2">
              <TopExpensesList expenses={overview.topExpenses} />
            </div>
          </div>

          {multiMonth && overview.categories.length > 0 && (
            <CategoryMonthHeatmap
              months={overview.months}
              monthly={overview.monthly}
              categories={overview.categories}
              currentMonth={overview.currentMonth}
            />
          )}

          <InsightsCard month={endMonth} />
        </div>
      )}
    </div>
  );
};
