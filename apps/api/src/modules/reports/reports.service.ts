import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { categories, transactions } from '../../db/schema';
import { walletsService } from '../wallets/wallets.service';
import { transactionsService } from '../transactions/transactions.service';
import { budgetsService } from '../budgets/budgets.service';
import { recurringService } from '../recurring/recurring.service';
import { formatBengaliMonth, paisaToTaka } from '@hisab/shared';

export class ReportsService {
  async getDashboardSummary(userId: string, month: string) {
    // 1. Wallets total balance
    const userWallets = await walletsService.getUserWallets(userId);
    const totalBalance = userWallets.reduce(
      (acc, w) => acc + BigInt(w.currentBalance || '0'),
      0n
    );

    // 2. Month transactions summary (income, expense, netSavings)
    const monthSummary = await transactionsService.getMonthSummary(userId, month);

    // 3. Budget summary
    const budgetSummary = await budgetsService.getBudgetSummary(userId, month);

    // 4. Category expenses breakdown (for donut/pie charts)
    const categorySpent = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryShortLabel: categories.shortLabel,
        color: categories.color,
        amount: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          sql`${transactions.occurredOn}::text LIKE ${month + '%'}`
        )
      )
      .groupBy(
        transactions.categoryId,
        categories.name,
        categories.shortLabel,
        categories.color
      )
      .orderBy(desc(sql`SUM(${transactions.amount})`));

    const totalExp = BigInt(monthSummary.totalExpense || '0');
    const categoryExpenses = categorySpent.map((c) => {
      const amt = BigInt(c.amount || '0');
      const pct = totalExp > 0n ? Math.round(Number((amt * 100n) / totalExp)) : 0;
      return {
        categoryId: c.categoryId!,
        categoryName: c.categoryName,
        categoryShortLabel: c.categoryShortLabel,
        color: c.color,
        amount: amt.toString(),
        percentage: pct,
      };
    });

    // 5. Recent 5 transactions
    const recentTransactions = await transactionsService.getTransactions(userId, { limit: 5 });

    // 6. Upcoming active recurring bills
    const allRules = await recurringService.getUserRules(userId);
    const upcomingBills = allRules.filter((r) => r.active).slice(0, 5);

    return {
      month,
      totalIncome: monthSummary.totalIncome,
      totalExpense: monthSummary.totalExpense,
      netSavings: monthSummary.netSavings,
      totalBalance: totalBalance.toString(),
      budgetSummary: {
        totalBudget: budgetSummary.totalBudget,
        totalSpent: budgetSummary.totalSpent,
        remainingBudget: budgetSummary.remainingBudget,
        percentage: budgetSummary.percentage,
        overBudgetCount: budgetSummary.overBudgetCount,
        warningCount: budgetSummary.warningCount,
      },
      categoryExpenses,
      recentTransactions,
      upcomingBills,
    };
  }

  /**
   * Retrieves income, expense and net trend for the past N months.
   */
  async getTrend(userId: string, monthsCount = 6) {
    const months: string[] = [];
    const now = new Date();
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
      months.push(d.toISOString().slice(0, 7));
    }

    const results = [];
    for (const m of months) {
      const summary = await transactionsService.getMonthSummary(userId, m);
      results.push({
        month: m,
        monthLabel: formatBengaliMonth(m),
        income: paisaToTaka(summary.totalIncome),
        expense: paisaToTaka(summary.totalExpense),
        savings: paisaToTaka(summary.netSavings),
      });
    }

    return results;
  }

  /**
   * Detailed category expense breakdown with previous month comparison.
   */
  async getCategoryBreakdown(userId: string, month: string) {
    const [y, m] = month.split('-').map(Number);
    const prevDate = new Date(Date.UTC(y, m - 2, 1));
    const prevMonth = prevDate.toISOString().slice(0, 7);

    const getSpentForMonth = async (targetMonth: string) => {
      const rows = await db
        .select({
          categoryId: transactions.categoryId,
          categoryName: categories.name,
          categoryColor: categories.color,
          categoryShortLabel: categories.shortLabel,
          total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
          txCount: sql<string>`COUNT(*)`,
        })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense'),
            sql`${transactions.occurredOn}::text LIKE ${targetMonth + '%'}`
          )
        )
        .groupBy(
          transactions.categoryId,
          categories.name,
          categories.color,
          categories.shortLabel
        );

      const map = new Map<string, { total: bigint; count: number; name: string; color: number; shortLabel: string }>();
      for (const r of rows) {
        if (r.categoryId) {
          map.set(r.categoryId, {
            total: BigInt(r.total || '0'),
            count: parseInt(r.txCount || '0', 10),
            name: r.categoryName,
            color: r.categoryColor,
            shortLabel: r.categoryShortLabel,
          });
        }
      }
      return map;
    };

    const currentMap = await getSpentForMonth(month);
    const prevMap = await getSpentForMonth(prevMonth);

    // Collect all unique categories
    const allCatIds = Array.from(new Set([...currentMap.keys(), ...prevMap.keys()]));

    return allCatIds.map((catId) => {
      const cur = currentMap.get(catId);
      const prev = prevMap.get(catId);

      const currentAmount = cur?.total || 0n;
      const prevAmount = prev?.total || 0n;
      const diff = currentAmount - prevAmount;

      return {
        categoryId: catId,
        categoryName: cur?.name || prev?.name || 'ক্যাটাগরি',
        color: cur?.color ?? prev?.color ?? 1,
        shortLabel: cur?.shortLabel || prev?.shortLabel || '',
        currentAmount: currentAmount.toString(),
        prevAmount: prevAmount.toString(),
        diff: diff.toString(),
        txCount: cur?.count || 0,
      };
    });
  }

  /**
   * Generates CSV export for transactions in a given month or overall.
   */
  async getExportCsv(userId: string, month?: string): Promise<string> {
    const txs = await transactionsService.getTransactions(userId, {
      month: month || undefined,
      limit: 100,
    });

    const headers = ['তারিখ', 'ধরণ', 'খাত / বিবরণ', 'ওয়ালেট', 'টাকা (৳)', 'নোট'];
    const rows = txs.map((t) => [
      t.occurredOn,
      t.type === 'income' ? 'আয়' : t.type === 'expense' ? 'খরচ' : 'ট্রান্সফার',
      t.categoryName || (t.type === 'transfer' ? `${t.walletName} ➔ ${t.toWalletName}` : ''),
      t.walletName || '',
      paisaToTaka(t.amount).toString(),
      (t.note || '').replace(/"/g, '""'),
    ]);

    const csvContent = [
      '\uFEFF' + headers.join(','), // UTF-8 BOM for Excel Bangla support
      ...rows.map((r) => r.map((f) => `"${f}"`).join(',')),
    ].join('\r\n');

    return csvContent;
  }
}

export const reportsService = new ReportsService();
