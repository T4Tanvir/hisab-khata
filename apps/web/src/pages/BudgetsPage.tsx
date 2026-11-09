import React, { useState } from 'react';
import {
  useBudgets,
  useBudgetSummary,
  BudgetCard,
  BudgetOverviewCards,
  BudgetFormModal,
} from '@/features/budgets';
import { getDhakaMonth, type Budget } from '@hisab/shared';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, PieChart } from 'lucide-react';

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

export const BudgetsPage: React.FC = () => {
  const { t, formatMonthStr } = useLanguage();
  const currentMonth = getDhakaMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedBudgetToEdit, setSelectedBudgetToEdit] = useState<Budget | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'budgeted' | 'unbudgeted'>('all');

  const { data: budgets = [], isLoading: isBudgetsLoading } = useBudgets(selectedMonth);
  const { data: summary, isLoading: isSummaryLoading } = useBudgetSummary(selectedMonth);

  const handleEdit = (budget: Budget) => {
    setSelectedBudgetToEdit(budget);
    setIsModalOpen(true);
  };

  // Categories that need attention first: over → warning → on track (by % used) → no limit
  const urgency = (b: (typeof budgets)[number]) => {
    if (BigInt(b.amount || '0') === 0n) return 3;
    if (b.status === 'exceeded') return 0;
    if (b.status === 'warning') return 1;
    return 2;
  };
  const filteredBudgets = budgets
    .filter((b) => {
      const hasBudget = BigInt(b.amount || '0') > 0n;
      if (filterTab === 'budgeted') return hasBudget;
      if (filterTab === 'unbudgeted') return !hasBudget;
      return true;
    })
    .sort((a, b) => urgency(a) - urgency(b) || (b.percentage || 0) - (a.percentage || 0));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* হেডার ও মাস পরিবর্তন */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.budgets.title}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            {t.nav.budgets}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t.budgets.subtitle}
          </p>
        </div>

        {/* মাস নির্বাচন */}
        <div className="inline-flex items-center rounded-xl border bg-card p-1 shadow-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors"
            title={t.common.prevMonth}
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
            title={t.common.nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* সামগ্রিক সারাংশ কার্ডসমূহ */}
      <BudgetOverviewCards summary={summary} isLoading={isSummaryLoading} />

      {/* ফিল্টার ট্যাব ও তালিকা */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="grid grid-cols-3 sm:inline-flex rounded-xl border bg-muted/40 p-1 w-full sm:w-auto text-center gap-0.5">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors truncate ${
                filterTab === 'all'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.budgets.allTab} ({budgets.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('budgeted')}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors truncate ${
                filterTab === 'budgeted'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.budgets.budgetedTab} ({summary?.budgetedCategoriesCount || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('unbudgeted')}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors truncate ${
                filterTab === 'unbudgeted'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.budgets.unbudgetedTab} ({(budgets.length - (summary?.budgetedCategoriesCount || 0)) || 0})
            </button>
          </div>
        </div>

        {/* বাজেট কার্ড গ্রিড */}
        {isBudgetsLoading ? (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 rounded-xl border bg-card/60 animate-pulse p-4 space-y-3"
              >
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-2 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredBudgets.length === 0 ? (
          <Card className="text-center py-12 px-4 border-dashed">
            <CardContent className="space-y-3">
              <PieChart className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
              <p className="font-semibold text-foreground text-sm">
                {t.budgets.noCategories}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {t.budgets.noCategoriesHint}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
            {filteredBudgets.map((b) => (
              <BudgetCard key={b.categoryId} budget={b} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </div>

      {/* বাজেট সম্পাদনা মডাল */}
      <BudgetFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBudgetToEdit(null);
        }}
        budget={selectedBudgetToEdit}
        month={selectedMonth}
      />
    </div>
  );
};
