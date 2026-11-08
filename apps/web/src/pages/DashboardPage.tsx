import React, { useState } from 'react';
import { useSession } from '@/features/auth/auth-client';
import { formatBengaliMonth, getDhakaMonth } from '@hisab/shared';
import { useWallets } from '@/features/wallets';
import {
  useTransactions,
  useMonthSummary,
  TransactionRow,
  TransactionFormModal,
  BudgetAlertBanner,
  type BudgetAlert,
} from '@/features/transactions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/Money';
import {
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Plus,
  Receipt,
  PiggyBank,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { data: session } = useSession();
  const currentMonth = getDhakaMonth();
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [budgetAlert, setBudgetAlert] = useState<BudgetAlert | null>(null);

  const { data: wallets = [], isLoading: isWalletsLoading } = useWallets();
  const { data: summary, isLoading: isSummaryLoading } = useMonthSummary(currentMonth);
  // Latest 5 overall (not just this month), so the list isn't empty on the 1st of a month
  const { data: recentTxs = [], isLoading: isTxLoading } = useTransactions({ limit: 5 });

  // Calculate total balance across all wallets
  const totalBalance = React.useMemo(() => {
    return wallets.reduce((acc, w) => acc + BigInt(w.currentBalance || '0'), 0n);
  }, [wallets]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            স্বাগতম, {session?.user?.name || 'ব্যবহারকারী'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            ড্যাশবোর্ড
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatBengaliMonth(currentMonth)}-এর অর্থনৈতিক সারসংক্ষেপ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs sm:text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            {formatBengaliMonth(currentMonth)}
          </Badge>
          <Button onClick={() => setIsTxModalOpen(true)} className="gap-1.5 text-xs sm:text-sm">
            <Plus className="h-4 w-4" />
            নতুন লেনদেন
          </Button>
        </div>
      </div>

      {budgetAlert && (
        <BudgetAlertBanner alert={budgetAlert} onDismiss={() => setBudgetAlert(null)} />
      )}

      {/* সারসংক্ষেপ কার্ডসমূহ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* মোট নগদ ও ব্যাংক স্থিতি */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                মোট স্থিতি (ব্যালেন্স)
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {isWalletsLoading ? (
                  <span className="text-muted-foreground text-sm">হিসাব হচ্ছে...</span>
                ) : (
                  <Money amount={totalBalance.toString()} />
                )}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* চলতি মাসে আয় */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                চলতি মাসে আয়
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

        {/* চলতি মাসে খরচ */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                চলতি মাসে খরচ
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
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                নিট সঞ্চয়
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {isSummaryLoading ? (
                  <span className="text-muted-foreground text-sm">হিসাব হচ্ছে...</span>
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

      {/* সাম্প্রতিক লেনদেনের তালিকা */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold font-display">সাম্প্রতিক লেনদেন</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">সর্বশেষ ৫টি লেনদেনের বিবরণ</p>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline underline-offset-4"
          >
            সব দেখুন <ArrowUpRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {isTxLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : recentTxs.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed bg-muted/20">
              <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-foreground">এখনো কোনো লেনদেন নেই</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                আয়, খরচ বা ব্যাংক ট্রাফসফারের হিসাব সংরক্ষণ করতে প্রথম লেনদেন যোগ করুন।
              </p>
              <Button size="sm" onClick={() => setIsTxModalOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> প্রথম লেনদেন যোগ করুন
              </Button>
            </div>
          ) : (
            recentTxs.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))
          )}
        </CardContent>
      </Card>

      {/* নতুন লেনদেন ফর্ম মডাল */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={(alert) => setBudgetAlert(alert ?? null)}
      />
    </div>
  );
};
