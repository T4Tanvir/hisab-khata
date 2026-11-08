import React from 'react';
import { formatBengaliMonth } from '@hisab/shared';
import type { Wallet, Category } from '@hisab/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

interface TransactionFiltersProps {
  month: string;
  onMonthChange: (month: string) => void;
  type?: 'expense' | 'income' | 'transfer';
  onTypeChange: (type?: 'expense' | 'income' | 'transfer') => void;
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
  const isFiltered = Boolean(type || walletId || categoryId || searchQuery);

  // Filter categories shown in dropdown based on active type if income/expense
  const filteredCategories = React.useMemo(() => {
    if (!type || type === 'transfer') return categories;
    return categories.filter((c) => c.type === type);
  }, [categories, type]);

  return (
    <div className="space-y-4">
      {/* ১ম সারি: মাস পরিবর্তন ও ধরন সিলেকশন */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* মাস নেভিগেশন */}
        <div className="inline-flex items-center rounded-xl border bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => onMonthChange(getPrevMonth(month))}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors"
            title="পূর্ববর্তী মাস"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[130px] px-3 text-center text-sm font-bold font-display text-foreground select-none">
            {formatBengaliMonth(month)}
          </div>
          <button
            type="button"
            onClick={() => onMonthChange(getNextMonth(month))}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors"
            title="পরবর্তী মাস"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* লেনদেনের ধরণ সেগমেন্ট ফিল্টার */}
        <div className="inline-flex rounded-xl border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => onTypeChange(undefined)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              !type
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            সব
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('expense')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              type === 'expense'
                ? 'bg-card text-neg shadow-sm'
                : 'text-muted-foreground hover:text-neg'
            }`}
          >
            খরচ
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('income')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              type === 'income'
                ? 'bg-card text-pos shadow-sm'
                : 'text-muted-foreground hover:text-pos'
            }`}
          >
            আয়
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('transfer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              type === 'transfer'
                ? 'bg-card text-blue-500 shadow-sm'
                : 'text-muted-foreground hover:text-blue-500'
            }`}
          >
            ট্রান্সফার
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
            placeholder="নোট বা বিবরণ খুঁজুন..."
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
            <option value="">সব ওয়ালেট</option>
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
            disabled={type === 'transfer'}
            className="w-full h-9 rounded-md border border-input bg-card px-3 py-1 text-xs sm:text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="">সব ক্যাটাগরি</option>
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
              title="ফিল্টার রিসেট করুন"
            >
              রিসেট
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
