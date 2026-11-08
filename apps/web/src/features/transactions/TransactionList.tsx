import React, { useMemo } from 'react';
import type { Transaction } from '@hisab/shared';
import { formatBengaliDate } from '@hisab/shared';
import { TransactionRow } from './TransactionRow';
import { Button } from '@/components/ui/button';
import { Receipt, Plus } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
  onAddNew?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  // Group transactions by occurredOn date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const list = map.get(tx.occurredOn) || [];
      list.push(tx);
      map.set(tx.occurredOn, list);
    }
    // Return sorted by date desc
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl border bg-card/60 animate-pulse flex items-center px-4 justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            </div>
            <div className="h-5 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-2xl bg-card border-dashed">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
          <Receipt className="h-7 w-7 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-bold font-display text-foreground">
          কোনো লেনদেন পাওয়া যায়নি
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
          নির্বাচিত ফিল্টারে এই মুহূর্তে কোনো লেনদেনের তথ্য নেই। নতুন হিসাব শুরু করতে নিচের বাটনে চাপ দিন।
        </p>
        {onAddNew && (
          <Button onClick={onAddNew} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            নতুন লেনদেন যোগ করুন
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedByDate.map(([date, items]) => {
        return (
          <div key={date} className="space-y-2.5">
            {/* তারিখ হেডার */}
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                {formatBengaliDate(date)}
              </h4>
              <span className="text-xs text-muted-foreground/75 font-mono">
                {items.length} টি লেনদেন
              </span>
            </div>

            {/* ঐ তারিখের লেনদেনের তালিকা */}
            <div className="space-y-2">
              {items.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
