import React from 'react';
import { Link } from 'react-router-dom';
import type { Transaction } from '@hisab/shared';
import { Money } from '@/components/Money';
import { CategoryChip } from '@/components/CategoryChip';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Pencil,
  Trash2,
  HandCoins,
} from 'lucide-react';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const isIncome = transaction.type === 'income' || transaction.type === 'loan_in';
  const isExpense = transaction.type === 'expense' || transaction.type === 'loan_out';
  const isTransfer = transaction.type === 'transfer';
  const isLoan = !!transaction.loanId || transaction.type === 'loan_in' || transaction.type === 'loan_out';

  return (
    <div className="group flex items-center justify-between p-3 sm:p-4 rounded-xl border bg-card hover:bg-accent/40 transition-colors gap-2.5 sm:gap-3">
      {/* বাম পাশে আইকন ও বিবরণ */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div
          className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${
            isIncome
              ? 'bg-pos/10 text-pos'
              : isExpense
              ? 'bg-neg/10 text-neg'
              : 'bg-blue-500/10 text-blue-500'
          }`}
        >
          {isIncome && <ArrowDownLeft className="h-5 w-5" />}
          {isExpense && <ArrowUpRight className="h-5 w-5" />}
          {isTransfer && <ArrowLeftRight className="h-5 w-5" />}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {isTransfer ? (
              <span className="font-semibold text-sm sm:text-base text-foreground flex items-center gap-1.5">
                <span>{transaction.walletName || 'ওয়ালেট'}</span>
                <span className="text-muted-foreground text-xs">➔</span>
                <span className="text-primary font-medium">{transaction.toWalletName || 'অন্য ওয়ালেট'}</span>
              </span>
            ) : isLoan ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm sm:text-base text-foreground truncate">
                  {transaction.note || (isIncome ? 'ধার গ্রহণ / আদায়' : 'ধার প্রদান / পরিশোধ')}
                </span>
                <Link to="/loans" className="inline-flex">
                  <Badge
                    variant="outline"
                    className="text-[11px] px-2 py-0 h-5 font-semibold border-primary/30 text-primary bg-primary/10 gap-1 hover:bg-primary/20 transition-colors"
                  >
                    <HandCoins className="h-3 w-3" />
                    ধার
                  </Badge>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base text-foreground truncate">
                  {transaction.categoryName || 'অনির্ধারিত ক্যাটাগরি'}
                </span>
                {transaction.categoryShortLabel && (
                  <CategoryChip
                    label={transaction.categoryShortLabel}
                    color={transaction.categoryColor || 1}
                    size="sm"
                  />
                )}
              </div>
            )}

            {!isTransfer && transaction.walletName && (
              <Badge variant="outline" className="text-[11px] px-2 py-0 h-5 font-normal text-muted-foreground">
                {transaction.walletName}
              </Badge>
            )}
          </div>

          {!isLoan && transaction.note && (
            <p className="text-xs text-muted-foreground truncate">
              {transaction.note}
            </p>
          )}
        </div>
      </div>

      {/* ডান পাশে টাকার পরিমাণ ও অ্যাকশন বাটনসমূহ */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="text-right">
          <Money
            amount={transaction.amount}
            showSign={!isTransfer}
            type={isIncome ? 'income' : isExpense ? 'expense' : 'neutral'}
            className={`text-sm sm:text-base font-bold font-mono tracking-tight ${
              isIncome ? 'text-pos' : isExpense ? 'text-neg' : 'text-foreground'
            }`}
          />
        </div>

        {!isLoan && (onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(transaction)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="সম্পাদনা করুন"
                aria-label="সম্পাদনা করুন"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(transaction)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="মুছে ফেলুন"
                aria-label="মুছে ফেলুন"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
