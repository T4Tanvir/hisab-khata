import React, { useState } from 'react';
import {
  useDashboardSummary,
  useTrend,
  useCategoryBreakdown,
  downloadExportCsv,
  TrendChart,
  CategoryBreakdownTable,
  InsightsCard,
} from '@/features/reports';
import { getDhakaMonth } from '@hisab/shared';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/Money';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
} from 'lucide-react';

function getPrevMonth(current: string): string {
  const [y, m] = current.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 2, 1));
  return date.toISOString().slice(0, 7);
}

function getNextMonth(current: string): string {
  const [y, m] = current.split('-').map(Number);
  const date = new Date(Date.UTC(y, m, 1));
  return date.toISOString().slice(0, 7);
}

export const ReportsPage: React.FC = () => {
  const { t, formatMonthStr } = useLanguage();
  const currentMonth = getDhakaMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary(selectedMonth);
  const { data: trendData = [], isLoading: isTrendLoading } = useTrend(6);
  const { data: categoryData = [], isLoading: isCategoryLoading } = useCategoryBreakdown(selectedMonth);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* হেডার ও মাস পরিবর্তন */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.reports.title}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            {t.nav.reports}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t.reports.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* মাস নেভিগেশন */}
          <div className="inline-flex items-center rounded-xl border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[130px] px-3 text-center text-sm font-bold font-display text-foreground select-none">
              {formatMonthStr(selectedMonth)}
            </div>
            <button
              type="button"
              onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors"
              title="পরবর্তী মাস"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* CSV ডাউনলোড বাটন */}
          <Button
            variant="outline"
            onClick={() => downloadExportCsv(selectedMonth)}
            className="gap-2 h-10 shadow-sm"
          >
            <Download className="h-4 w-4" />
            {t.reports.exportCsv}
          </Button>
        </div>
      </div>

      {/* মাসের সারাংশ কার্ডসমূহ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.dashboard.totalIncome}
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-pos">
                {isSummaryLoading ? (
                  <span className="text-muted-foreground text-sm">{t.common.loading}</span>
                ) : (
                  <Money amount={summary?.totalIncome || '0'} showSign={false} />
                )}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pos/10 text-pos">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.dashboard.totalExpense}
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neg">
                {isSummaryLoading ? (
                  <span className="text-muted-foreground text-sm">{t.common.loading}</span>
                ) : (
                  <Money amount={summary?.totalExpense || '0'} showSign={false} />
                )}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neg/10 text-neg">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {BigInt(summary?.netSavings || '0') >= 0n ? t.dashboard.netSavings : t.dashboard.netDeficit}
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {isSummaryLoading ? (
                  <span className="text-muted-foreground text-sm">{t.common.loading}</span>
                ) : (
                  <Money
                    amount={summary?.netSavings || '0'}
                    showSign
                    type={BigInt(summary?.netSavings || '0') >= 0n ? 'income' : 'expense'}
                  />
                )}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <PiggyBank className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* এআই ফিন্যান্সিয়াল ইনসাইট */}
      <InsightsCard month={selectedMonth} />

      {/* ৬ মাসের ট্রেন্ড চার্ট */}
      <TrendChart data={trendData} isLoading={isTrendLoading} />

      {/* খাতভিত্তিক বিস্তারিত তুলনা টেবিল */}
      <CategoryBreakdownTable categories={categoryData} isLoading={isCategoryLoading} />
    </div>
  );
};
