import React from 'react';
import type { Wallet, Category } from '@hisab/shared';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

/** Transaction types the list can be filtered by (the API accepts one type at a time) */
export type TransactionTypeFilter = 'expense' | 'income' | 'transfer' | 'saving';

interface TransactionFiltersProps {
  month: string;
  onMonthChange: (month: string) => void;
  type?: TransactionTypeFilter;
  onTypeChange: (type?: TransactionTypeFilter) => void;
  walletId?: string;
  onWalletChange: (walletId?: string) => void;
  categoryId?: string;
  onCategoryChange: (categoryId?: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  wallets: Wallet[];
  categories: Category[];
  onResetFilters: () => void;
}

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

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  month,
  onMonthChange,
  type,
  onTypeChange,
  walletId,
  onWalletChange,
  categoryId,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  wallets,
  categories,
  onResetFilters,
}) => {
  const { t, formatMonthStr } = useLanguage();
  const isFiltered = Boolean(type || walletId || categoryId || searchQuery);

  // Only income/expense rows have categories; transfers and savings have none
  const hasCategories = !type || type === 'income' || type === 'expense';
  const filteredCategories = React.useMemo(() => {
    if (!type || !hasCategories) return categories;
    return categories.filter((c) => c.type === type);
  }, [categories, type, hasCategories]);

  return (
    <div className="space-y-4">
      {/* ১ম সারি: মাস পরিবর্তন ও ধরন সিলেকশন */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* মাস নেভিগেশন */}
        <div className="inline-flex items-center justify-between sm:justify-start rounded-xl border bg-card p-1 shadow-sm w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onMonthChange(getPrevMonth(month))}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors shrink-0"
            title={t.common.prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[120px] sm:min-w-[130px] px-3 text-center text-xs sm:text-sm font-bold font-display text-foreground select-none truncate">
            {formatMonthStr(month)}
          </div>
          <button
            type="button"
            onClick={() => onMonthChange(getNextMonth(month))}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors shrink-0"
            title={t.common.nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* লেনদেনের ধরণ সেগমেন্ট ফিল্টার */}
        <div className="grid grid-cols-5 sm:inline-flex rounded-xl border bg-muted/40 p-1 w-full sm:w-auto text-center gap-0.5">
          <button
            type="button"
            onClick={() => onTypeChange(undefined)}
            className={`px-1.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors truncate ${
              !type
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.common.all}
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('expense')}
            className={`px-1.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors truncate ${
              type === 'expense'
                ? 'bg-card text-neg shadow-sm'
                : 'text-muted-foreground hover:text-neg'
            }`}
          >
            {t.common.expense}
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('income')}
            className={`px-1.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors truncate ${
              type === 'income'
                ? 'bg-card text-pos shadow-sm'
                : 'text-muted-foreground hover:text-pos'
            }`}
          >
            {t.common.income}
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('transfer')}
            className={`px-1.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors truncate ${
              type === 'transfer'
                ? 'bg-card text-blue-500 shadow-sm'
                : 'text-muted-foreground hover:text-blue-500'
            }`}
          >
            {t.common.transfer}
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('saving')}
            className={`px-1.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors truncate ${
              type === 'saving'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            {t.transactions.savingFilter}
          </button>
        </div>
      </div>

      {/* ২য় সারি: সার্চ, ওয়ালেট ও ক্যাটাগরি ড্রপডাউন */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {/* সার্চ বক্স */}
        <div className="relative sm:col-span-1 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.transactions.filterSearch}
            className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-card"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ওয়ালেট ফিল্টার */}
        <div>
          <select
            value={walletId || ''}
            onChange={(e) => onWalletChange(e.target.value || undefined)}
            className="w-full h-9 rounded-md border border-input bg-card px-3 py-1 text-xs sm:text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{t.transactions.allWallets}</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* ক্যাটাগরি ফিল্টার */}
        <div className="flex items-center gap-2">
          <select
            value={categoryId || ''}
            onChange={(e) => onCategoryChange(e.target.value || undefined)}
            disabled={!hasCategories}
            className="w-full h-9 rounded-md border border-input bg-card px-3 py-1 text-xs sm:text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="">{t.transactions.allCategoryOption}</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.shortLabel ? `(${c.shortLabel})` : ''}
              </option>
            ))}
          </select>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
              title={t.transactions.resetFiltersTitle}
            >
              {t.transactions.reset}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
