import React, { useState } from 'react';
import {
  useTransactions,
  useMonthSummary,
  useDeleteTransaction,
  TransactionList,
  TransactionFilters,
  TransactionFormModal,
  BudgetAlertBanner,
} from '@/features/transactions';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useWallets } from '@/features/wallets';
import { useCategories } from '@/features/categories';
import { getDhakaMonth, type Transaction } from '@hisab/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/Money';
import { Modal } from '@/components/ui/Modal';
import { Plus, ArrowDownLeft, ArrowUpRight, PiggyBank, AlertCircle } from 'lucide-react';
import type { BudgetAlert } from '@/features/transactions/api';

export const TransactionsPage: React.FC = () => {
  const currentMonth = getDhakaMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedType, setSelectedType] = useState<'expense' | 'income' | 'transfer' | undefined>();
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [budgetToast, setBudgetToast] = useState<BudgetAlert | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Wait until the user pauses typing before hitting the API
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 300);

  // Queries
  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useCategories();
  const { data: summary, isLoading: isSummaryLoading } = useMonthSummary(selectedMonth);

  const {
    data: transactions = [],
    isLoading: isTxLoading,
  } = useTransactions({
    month: selectedMonth,
    type: selectedType,
    walletId: selectedWalletId,
    categoryId: selectedCategoryId,
    q: debouncedSearch || undefined,
  });

  const deleteTx = useDeleteTransaction();

  const handleEdit = (tx: Transaction) => {
    setTxToEdit(tx);
    setIsFormOpen(true);
  };

  const closeDeleteModal = () => {
    setTxToDelete(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!txToDelete) return;
    setDeleteError(null);
    try {
      await deleteTx.mutateAsync(txToDelete.id);
      closeDeleteModal();
    } catch (err: any) {
      setDeleteError(err.message || 'লেনদেনটি মুছে ফেলা সম্ভব হয়নি');
    }
  };

  const handleResetFilters = () => {
    setSelectedType(undefined);
    setSelectedWalletId(undefined);
    setSelectedCategoryId(undefined);
    setSearchQuery('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* হেডার */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            হিসাবখাতা লেজার
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            লেনদেন
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            সব আয়, ব্যয় ও অ্যাকাউন্টের স্থানান্তরের সম্পূর্ণ হিসাব
          </p>
        </div>

        <Button
          onClick={() => {
            setTxToEdit(null);
            setIsFormOpen(true);
          }}
          className="gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          নতুন লেনদেন
        </Button>
      </div>

      {/* বাজেট সতর্কবার্তা টোস্ট / ব্যানার (যদি থাকে) */}
      {budgetToast && (
        <BudgetAlertBanner alert={budgetToast} onDismiss={() => setBudgetToast(null)} />
      )}

      {/* মাসের সারাংশ কার্ড (Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* মোট আয় */}
        <Card className="border-border/60 bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                চলতি মাসে মোট আয়
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-pos">
                {isSummaryLoading ? (
                  <span className="text-muted-foreground text-sm">হিসাব হচ্ছে...</span>
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

        {/* মোট খরচ */}
        <Card className="border-border/60 bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                চলতি মাসে মোট খরচ
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neg">
                {isSummaryLoading ? (
                  <span className="text-muted-foreground text-sm">হিসাব হচ্ছে...</span>
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

        {/* নিট স্থিতি / সঞ্চয় */}
        <Card className="border-border/60 bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                নিট স্থিতি (আয় - ব্যয়)
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {isSummaryLoading ? (
                  <span className="text-muted-foreground text-sm">হিসাব হচ্ছে...</span>
                ) : (
                  <Money
                    amount={summary?.netSavings || '0'}
                    showSign
                    type={
                      BigInt(summary?.netSavings || '0') >= 0n ? 'income' : 'expense'
                    }
                  />
                )}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <PiggyBank className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ফিল্টার বার */}
      <Card className="p-4 sm:p-5 border-border/60">
        <TransactionFilters
          month={selectedMonth}
          onMonthChange={setSelectedMonth}
          type={selectedType}
          onTypeChange={setSelectedType}
          walletId={selectedWalletId}
          onWalletChange={setSelectedWalletId}
          categoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          wallets={wallets}
          categories={categories}
          onResetFilters={handleResetFilters}
        />
      </Card>

      {/* লেনদেনের তালিকা */}
      <TransactionList
        transactions={transactions}
        isLoading={isTxLoading}
        onEdit={handleEdit}
        onDelete={(tx) => setTxToDelete(tx)}
        onAddNew={() => {
          setTxToEdit(null);
          setIsFormOpen(true);
        }}
      />

      {/* নতুন / এডিট লেনদেন মডাল */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setTxToEdit(null);
        }}
        transactionToEdit={txToEdit}
        defaultType={selectedType || 'expense'}
        onSuccess={(alert) => setBudgetToast(alert ?? null)}
      />

      {/* ডিলিট কনফার্মেশন মডাল */}
      <Modal
        isOpen={Boolean(txToDelete)}
        onClose={closeDeleteModal}
        title="লেনদেন মুছে ফেলুন"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            আপনি কি নিশ্চিতভাবে এই লেনদেনটি মুছে ফেলতে চান? এটি মুছে ফেললে আপনার সংশ্লিষ্ট ওয়ালেটের বর্তমান স্থিতি পুনরায় গণনা করা হবে।
          </p>
          {deleteError && (
            <div className="flex items-center gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}
          {txToDelete && (
            <div className="p-3 rounded-xl bg-muted/40 border text-xs sm:text-sm space-y-1">
              <div className="flex justify-between font-semibold text-foreground">
                <span>{txToDelete.categoryName || txToDelete.walletName}</span>
                <Money amount={txToDelete.amount} />
              </div>
              <p className="text-muted-foreground text-xs">{txToDelete.occurredOn} · {txToDelete.note || 'কোনো নোট নেই'}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              disabled={deleteTx.isPending}
            >
              বাতিল
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteTx.isPending}
            >
              {deleteTx.isPending ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
