import React, { useState } from 'react';
import { useSession } from '@/features/auth/auth-client';
import { getDhakaMonth, toBengaliDigits, paisaToTaka } from '@hisab/shared';
import { useDashboardSummary, InsightsCard } from '@/features/reports';
import { useLanguage } from '@/hooks/useLanguage';
import {
  TransactionRow,
  TransactionFormModal,
} from '@/features/transactions';
import { usePayRecurringRule, RecurringCard, RecurringFormModal } from '@/features/recurring';
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
  Target,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieIcon,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const CATEGORY_COLORS: Record<number, string> = {
  1: '#2a78d6',
  2: '#eb6834',
  3: '#1baf7a',
  4: '#eda100',
  5: '#e87ba4',
  6: '#008300',
  7: '#6250d6',
  8: '#e34948',
  9: '#8F978F',
};

export const DashboardPage: React.FC = () => {
  const { data: session } = useSession();
  const { language, t, formatMonthStr } = useLanguage();
  const currentMonth = getDhakaMonth();
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const payRuleMutation = usePayRecurringRule();

  const { data: summary, isLoading } = useDashboardSummary(currentMonth);

  // Chart data for category expenses
  const chartData = React.useMemo(() => {
    if (!summary?.categoryExpenses || summary.categoryExpenses.length === 0) {
      return [];
    }
    return summary.categoryExpenses.map((c) => ({
      name: c.categoryName,
      value: paisaToTaka(c.amount),
      color: CATEGORY_COLORS[c.color] || CATEGORY_COLORS[1],
      percentage: c.percentage,
    }));
  }, [summary?.categoryExpenses]);

  const totalBudget = BigInt(summary?.budgetSummary?.totalBudget || '0');
  const budgetPercentage = summary?.budgetSummary?.percentage || 0;
  const isOverBudget = budgetPercentage >= 100;
  const isWarningBudget = budgetPercentage >= 80 && budgetPercentage < 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* হেডার */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.dashboard.welcome}, {session?.user?.name || (language === 'bn' ? 'ব্যবহারকারী' : 'User')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            {t.nav.dashboard}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatMonthStr(currentMonth)} - {t.dashboard.overallSummary}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs sm:text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            {formatMonthStr(currentMonth)}
          </Badge>
          <Button onClick={() => setIsTxModalOpen(true)} className="gap-1.5 text-xs sm:text-sm shadow-sm font-semibold">
            <Plus className="h-4 w-4" />
            {t.transactions.newTransaction}
          </Button>
        </div>
      </div>

      {/* ৪টি মূল সারসংক্ষেপ কার্ড */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* মোট স্থিতি */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.dashboard.totalBalance}
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">{t.common.loading}</span>
                ) : (
                  <Money amount={summary?.totalBalance || '0'} />
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
                {t.dashboard.totalIncome}
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-pos">
                {isLoading ? (
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

        {/* চলতি মাসে খরচ */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.dashboard.totalExpense}
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neg">
                {isLoading ? (
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

        {/* নিট স্থিতি / সঞ্চয় */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {BigInt(summary?.netSavings || '0') >= 0n ? t.dashboard.netSavings : t.dashboard.netDeficit}
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {isLoading ? (
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

      {/* স্মার্ট ফিন্যান্সিয়াল ইনসাইট (AI Insights) */}
      <InsightsCard month={currentMonth} />

      {/* সামগ্রিক বাজেট অগ্রগতি কার্ড (Phase 4) */}
      {totalBudget > 0n && (
        <Card className="p-4 sm:p-5 border-border/60 bg-gradient-to-r from-card to-card/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-foreground leading-tight">
                  {t.dashboard.budgetProgress}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'bn'
                    ? `মোট বাজেটের ${toBengaliDigits(budgetPercentage)}% ব্যয় হয়েছে`
                    : `${budgetPercentage}% of total budget has been spent`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOverBudget ? (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertCircle className="h-3.5 w-3.5" /> {t.dashboard.overBudgetAlert}
                </Badge>
              ) : isWarningBudget ? (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> {t.dashboard.warningBudgetAlert}
                </Badge>
              ) : (
                <Badge variant="pos" className="gap-1 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t.dashboard.safeBudget}
                </Badge>
              )}

              <Link
                to="/budgets"
                className="text-xs font-semibold text-primary hover:underline ml-2"
              >
                {t.dashboard.seeAll} →
              </Link>
            </div>
          </div>

          <div className="w-full bg-muted/60 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget ? 'bg-destructive' : isWarningBudget ? 'bg-amber-500' : 'bg-pos'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span>{t.budgets.spent}: <Money amount={summary?.budgetSummary?.totalSpent || '0'} /></span>
            <span>{t.dashboard.totalBudgetLimit}: <Money amount={summary?.budgetSummary?.totalBudget || '0'} /></span>
          </div>
        </Card>
      )}

      {/* খাতভিত্তিক খরচের বিশ্লেষণ (Recharts চার্ট ও ব্রেকডাউন) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* পাই চার্ট */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold font-display">
                {t.dashboard.categoryExpenseChart}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {language === 'bn' ? 'এই মাসে কোন খাতে কত টাকা খরচ হয়েছে' : 'Expense distribution by category this month'}
              </p>
            </div>
            <PieIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            {chartData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                {t.dashboard.noExpenseData}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="w-full sm:w-1/2 h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [
                          language === 'bn'
                            ? `৳${toBengaliDigits(Number(val).toLocaleString())}`
                            : `৳${Number(val).toLocaleString()}`,
                          t.common.expense,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full sm:w-1/2 space-y-2">
                  {summary?.categoryExpenses.slice(0, 4).map((c) => (
                    <div key={c.categoryId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[c.color] || CATEGORY_COLORS[1] }}
                        />
                        <span className="truncate text-foreground font-medium">{c.categoryName}</span>
                      </div>
                      <div className="font-mono font-semibold text-foreground shrink-0">
                        <Money amount={c.amount} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* সাম্প্রতিক লেনদেনের তালিকা */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold font-display">
                {t.dashboard.recentTransactions}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'bn' ? 'সর্বশেষ লেনদেনের সংক্ষিপ্ত তালিকা' : 'Brief overview of recent activities'}
              </p>
            </div>
            <Link
              to="/transactions"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline underline-offset-4"
            >
              {t.dashboard.seeAll} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {!summary?.recentTransactions || summary.recentTransactions.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed bg-muted/20">
                <Receipt className="h-7 w-7 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-foreground">{t.dashboard.noTransactions}</p>
                <Button size="sm" onClick={() => setIsTxModalOpen(true)} className="gap-1 mt-3 text-xs">
                  <Plus className="h-3.5 w-3.5" /> {t.transactions.newTransaction}
                </Button>
              </div>
            ) : (
              summary.recentTransactions.slice(0, 4).map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* আসন্ন নিয়মিত বিল ও রিমাইন্ডার (Phase 5) */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">
                {t.dashboard.upcomingBills}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'bn'
                  ? 'মাসিক বাড়িভাড়া, বিদ্যুৎ, ওয়াইফাই বা বেতনের হিসাব'
                  : 'Rent, electricity, internet or regular dues'}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsRecurringModalOpen(true)}
            className="gap-1.5 h-8 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> {t.recurring.newBill}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {!summary?.upcomingBills || summary.upcomingBills.length === 0 ? (
            <div className="text-center py-6 px-4 rounded-xl border border-dashed bg-muted/20 text-xs text-muted-foreground">
              {t.dashboard.noUpcomingBills}
            </div>
          ) : (
            summary.upcomingBills.map((b) => (
              <RecurringCard
                key={b.id}
                rule={b}
                onPay={async (r) => {
                  await payRuleMutation.mutateAsync({ id: r.id });
                }}
                isPaying={payRuleMutation.isPending}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* নতুন লেনদেন ফর্ম মডাল */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
      />

      {/* নতুন নিয়মিত বিল মডাল */}
      <RecurringFormModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
      />
    </div>
  );
};
