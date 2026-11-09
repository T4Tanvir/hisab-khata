import React, { useState } from 'react';
import type { Loan, LoanDirection, LoanStatus } from '@hisab/shared';
import { useLoans, useLoanSummary, useDeleteLoan } from '@/features/loans';
import { LoanCard } from '@/features/loans/LoanCard';
import { LoanFormModal } from '@/features/loans/LoanFormModal';
import { LoanPaymentModal } from '@/features/loans/LoanPaymentModal';
import { LoanDetailModal } from '@/features/loans/LoanDetailModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useLanguage } from '@/hooks/useLanguage';
import { Money } from '@/components/Money';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  HandCoins,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
} from 'lucide-react';

export const LoansPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [directionFilter, setDirectionFilter] = useState<'all' | LoanDirection>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | LoanStatus>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);

  // Queries & Mutations
  const { data: summary } = useLoanSummary();
  const { data: loansList, isLoading: isLoansLoading } = useLoans({
    direction: directionFilter === 'all' ? undefined : directionFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    q: searchQuery.trim() || undefined,
  });

  const deleteMutation = useDeleteLoan();

  const handleOpenCreate = () => {
    setActiveLoan(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (loan: Loan) => {
    setActiveLoan(loan);
    setIsFormOpen(true);
  };

  const handleOpenPayment = (loan: Loan) => {
    setActiveLoan(loan);
    setIsPaymentOpen(true);
  };

  const handleOpenDetail = (loan: Loan) => {
    setActiveLoan(loan);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (loan: Loan) => {
    setActiveLoan(loan);
    setIsDeleteOpen(true);
  };

  // Errors are caught and shown inside the ConfirmationModal
  const handleConfirmDelete = async () => {
    if (!activeLoan) return;
    await deleteMutation.mutateAsync(activeLoan.id);
    setIsDeleteOpen(false);
    setActiveLoan(null);
  };

  const activeBorrowedCount = summary?.activeBorrowedCount ?? 0;
  const activeLentCount = summary?.activeLentCount ?? 0;

  return (
    <div className="space-y-6 pb-20">
      {/* হেডার */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight flex items-center gap-2.5">
            <HandCoins className="h-7 w-7 text-primary" />
            {t.loans.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t.loans.subtitle}
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="gap-1.5 shadow-sm font-semibold shrink-0"
        >
          <Plus className="h-4 w-4" />
          {t.loans.newLoan}
        </Button>
      </div>

      {/* দুটি মূল সামারি কার্ড: মোট দেনা ও মোট পাওনা */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* মোট দেনা (ধার নিলাম) */}
        <Card className="border-border/60 bg-card overflow-hidden">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t.loans.totalBorrowed}
              </p>
              <p className="font-display text-2xl sm:text-3xl font-bold text-destructive">
                <Money amount={summary?.totalBorrowedRemaining || '0'} />
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'bn'
                  ? `${activeBorrowedCount.toLocaleString('bn-BD')}টি সক্রিয় দেনা`
                  : `${activeBorrowedCount} active debts`}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 shadow-inner">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* মোট পাওনা (ধার দিলাম) */}
        <Card className="border-border/60 bg-card overflow-hidden">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t.loans.totalLent}
              </p>
              <p className="font-display text-2xl sm:text-3xl font-bold text-emerald-600">
                <Money amount={summary?.totalLentRemaining || '0'} />
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'bn'
                  ? `${activeLentCount.toLocaleString('bn-BD')}টি সক্রিয় পাওনা`
                  : `${activeLentCount} active receivables`}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ফিল্টার ও সার্চ বার */}
      <div className="space-y-3 bg-card p-3 sm:p-4 rounded-2xl border border-border/60 shadow-xs">
        {/* প্রধান ট্যাব: দেনা / পাওনা / সব */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl">
            <button
              type="button"
              onClick={() => setDirectionFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                directionFilter === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.common.all}
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('borrowed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                directionFilter === 'borrowed'
                  ? 'bg-destructive/15 text-destructive font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              {t.loans.borrowed}
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('lent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                directionFilter === 'lent'
                  ? 'bg-emerald-500/15 text-emerald-600 font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              {t.loans.lent}
            </button>
          </div>

          {/* স্ট্যাটাস ফিল্টার (চলতি / পরিশোধিত / সব) */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.loans.active}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('settled')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'settled'
                  ? 'bg-pos/15 text-pos font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.loans.settled}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-secondary text-foreground font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.common.all}
            </button>
          </div>
        </div>

        {/* সার্চ ইনপুট */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.loans.searchPlaceholder}
            className="pl-9 h-9 text-xs sm:text-sm bg-background border-border/70"
          />
        </div>
      </div>

      {/* লোনের তালিকা */}
      {isLoansLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          {t.common.loading}
        </div>
      ) : !loansList || loansList.length === 0 ? (
        <Card className="border-border/60 p-12 text-center bg-card">
          <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4 shadow-inner">
            <HandCoins className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-1">
            {t.loans.noLoans}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mb-5">
            {t.loans.emptyHint}
          </p>
          <Button onClick={handleOpenCreate} className="gap-1.5 font-semibold">
            <Plus className="h-4 w-4" />
            {t.loans.newLoan}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loansList.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onPayment={handleOpenPayment}
              onViewDetails={handleOpenDetail}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* মোডালসমূহ */}
      <LoanFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setActiveLoan(null);
        }}
        loan={activeLoan}
      />

      <LoanPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setActiveLoan(null);
        }}
        loan={activeLoan}
      />

      <LoanDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setActiveLoan(null);
        }}
        loan={activeLoan}
        onOpenPayment={(loan) => {
          setActiveLoan(loan);
          setIsPaymentOpen(true);
        }}
      />

      {/* ডিলিট কনফার্মেশন মোডাল */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setActiveLoan(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t.loans.deleteConfirmTitle}
        description={t.loans.deleteConfirmMessage}
        confirmText={t.common.yesDelete}
        cancelText={t.common.cancel}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
export default LoansPage;
