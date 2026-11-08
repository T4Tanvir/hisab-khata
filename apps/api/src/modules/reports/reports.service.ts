import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { categories, transactions } from '../../db/schema';
import { walletsService } from '../wallets/wallets.service';
import { transactionsService } from '../transactions/transactions.service';
import { budgetsService } from '../budgets/budgets.service';

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
      upcomingBills: [],
    };
  }
}

export const reportsService = new ReportsService();
