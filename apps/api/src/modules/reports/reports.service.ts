import { and, desc, eq, gte, lt, sql, type SQL } from 'drizzle-orm';
import { db } from '../../db/client';
import { categories, transactions } from '../../db/schema';
import { walletsService } from '../wallets/wallets.service';
import { transactionsService } from '../transactions/transactions.service';
import { budgetsService } from '../budgets/budgets.service';
import { recurringService } from '../recurring/recurring.service';
import {
  formatBengaliMonth,
  paisaToTaka,
  formatMoney,
  toBengaliDigits,
  getDhakaDate,
  getDhakaMonth,
  monthDateRange,
  type FinancialInsight,
  type TransactionType,
} from '@hisab/shared';

/** occurred_on within a YYYY-MM month (same rule everywhere, index friendly). */
function inMonth(month: string): SQL {
  const { start, end } = monthDateRange(month);
  return and(gte(transactions.occurredOn, start), lt(transactions.occurredOn, end))!;
}

const TYPE_LABELS: Record<TransactionType, string> = {
  income: 'আয়',
  expense: 'খরচ',
  transfer: 'ট্রান্সফার',
  loan_in: 'ধার (টাকা এল)',
  loan_out: 'ধার (টাকা গেল)',
  saving: 'সঞ্চয়ে জমা',
};

/** Quote a CSV cell; neutralise spreadsheet formulas (=, +, -, @) in user text. */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

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
          inMonth(month)
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
    // Months counted back from the current Asia/Dhaka month (not the server's clock)
    const [cy, cm] = getDhakaMonth().split('-').map(Number);
    const months: string[] = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      months.push(new Date(Date.UTC(cy, cm - 1 - i, 1)).toISOString().slice(0, 7));
    }

    const results = await Promise.all(
      months.map(async (m) => {
        const summary = await transactionsService.getMonthSummary(userId, m);
        return {
          month: m,
          monthLabel: formatBengaliMonth(m),
          income: paisaToTaka(summary.totalIncome),
          expense: paisaToTaka(summary.totalExpense),
          savings: paisaToTaka(summary.netSavings),
        };
      })
    );

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
            inMonth(targetMonth)
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
  async getExportCsv(userId: string, range?: { from: string; to: string }): Promise<string> {
    // Export everything in the chosen months (or all time); no page-size limit
    const txs = range
      ? await transactionsService.getTransactionsBetween(
          userId,
          monthDateRange(range.from).start,
          monthDateRange(range.to).end
        )
      : await transactionsService.getTransactions(userId, { limit: 1_000_000 });

    const headers = ['তারিখ', 'ধরণ', 'খাত / বিবরণ', 'ওয়ালেট', 'টাকা (৳)', 'নোট'];
    const rows = txs.map((t) => [
      t.occurredOn,
      TYPE_LABELS[t.type] ?? t.type,
      t.categoryName ||
        (t.type === 'transfer' ? `${t.walletName} ➔ ${t.toWalletName}` : t.loanPersonName || t.goalName || ''),
      t.walletName || '',
      paisaToTaka(t.amount).toFixed(2),
      t.note || '',
    ]);

    const csvContent = [
      '\uFEFF' + headers.join(','), // UTF-8 BOM for Excel Bangla support
      ...rows.map((r) => r.map(csvCell).join(',')),
    ].join('\r\n');

    return csvContent;
  }

  /**
   * Generates AI Financial Insights:
   * - Category expense spikes compared to previous month
   * - Budget run-rate burn velocity predictions
   * - Savings rate health benchmarks
   * - Imminent recurring bills alerts
   * - Dominant expense leak identification
   */
  async getFinancialInsights(userId: string, month: string): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const today = getDhakaDate();

    // 1. Calculate previous month
    const [y, m] = month.split('-').map(Number);
    const prevMonth = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);

    // 2. Fetch category expenses for current month
    const currentMonthExpenses = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        amount: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          inMonth(month)
        )
      )
      .groupBy(transactions.categoryId, categories.name)
      .orderBy(desc(sql`SUM(${transactions.amount})`));

    // 3. Fetch category expenses for previous month
    const prevMonthExpenses = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        amount: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          inMonth(prevMonth)
        )
      )
      .groupBy(transactions.categoryId, categories.name);

    const prevMap = new Map<string, bigint>();
    for (const p of prevMonthExpenses) {
      if (p.categoryId) {
        prevMap.set(p.categoryId, BigInt(p.amount || '0'));
      }
    }

    // 4. Check for Category Expense Spikes (>= 25% increase and >= ৳500 diff)
    for (const curr of currentMonthExpenses) {
      if (!curr.categoryId) continue;
      const currAmt = BigInt(curr.amount || '0');
      const prevAmt = prevMap.get(curr.categoryId) || 0n;

      if (prevAmt > 0n && currAmt > prevAmt) {
        const diff = currAmt - prevAmt;
        if (diff >= 50000n) { // at least ৳500 increase
          const pctIncrease = Math.round(Number((diff * 100n) / prevAmt));
          if (pctIncrease >= 25) {
            insights.push({
              id: `spike-${curr.categoryId}`,
              type: 'spike',
              severity: pctIncrease >= 50 ? 'alert' : 'warning',
              titleBn: `${curr.categoryName} খাতে খরচ বৃদ্ধি`,
              titleEn: `Spending Spike in ${curr.categoryName}`,
              descriptionBn: `এই মাসে '${curr.categoryName}' খাতে খরচ গত মাসের চেয়ে ${toBengaliDigits(pctIncrease)}% বেশি হয়েছে।`,
              descriptionEn: `Spending on '${curr.categoryName}' is ${pctIncrease}% higher than last month.`,
              metric: `+${pctIncrease}%`, metricEn: `+${pctIncrease}%`,
              categoryId: curr.categoryId,
            });
          }
        }
      }
    }

    // 5. Check Budget Run-rate Burn Velocity
    const userBudgets = await budgetsService.getBudgets(userId, month);
    const dayOfMonth = parseInt(today.slice(8, 10), 10);
    const isCurrentActiveMonth = today.slice(0, 7) === month;

    if (isCurrentActiveMonth && dayOfMonth > 3) {
      for (const b of userBudgets) {
        const spentAmt = BigInt(b.spentAmount || '0');
        const budgetAmt = BigInt(b.amount || '0');
        const remainingAmt = budgetAmt - spentAmt;

        if (budgetAmt > 0n && spentAmt > 0n) {
          // If already exceeded
          if (b.percentage >= 100) {
            insights.push({
              id: `over-${b.id}`,
              type: 'burn_rate',
              severity: 'alert',
              titleBn: `${b.categoryName || 'বাজেট'} অতিক্রম করেছে`,
              titleEn: `${b.categoryName || 'Budget'} Exceeded`,
              descriptionBn: `'${b.categoryName}' খাতের নির্ধারিত বাজেট ${toBengaliDigits(b.percentage)}% শেষ হয়ে গেছে!`,
              descriptionEn: `'${b.categoryName}' budget limit has been exceeded (${b.percentage}% spent)!`,
              metric: `${b.percentage}%`, metricEn: `${b.percentage}%`,
              categoryId: b.categoryId,
            });
          } else if (b.percentage >= 65 && dayOfMonth <= 20) {
            // High burn rate early in the month
            const dailyBurn = Number(spentAmt) / dayOfMonth;
            const daysLeft = dailyBurn > 0 ? Math.max(1, Math.round(Number(remainingAmt) / dailyBurn)) : 0;
            insights.push({
              id: `burn-${b.id}`,
              type: 'burn_rate',
              severity: 'warning',
              titleBn: `${b.categoryName || 'বাজেট'}-এর দ্রুত ব্যয়`,
              titleEn: `Fast Burn on ${b.categoryName || 'Budget'}`,
              descriptionBn: `বর্তমান খরচের গতি বজায় থাকলে আর প্রায় ${toBengaliDigits(daysLeft)} দিনের মধ্যেই '${b.categoryName}' বাজেট শেষ হয়ে যেতে পারে।`,
              descriptionEn: `At current spending rate, '${b.categoryName}' budget may be exhausted in approximately ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
              metric: `${b.percentage}% ব্যবহৃত`,
              metricEn: `${b.percentage}% used`,
              categoryId: b.categoryId,
            });
          }
        }
      }
    }

    // 6. Savings Rate Health Check
    const monthSummary = await transactionsService.getMonthSummary(userId, month);
    const totalInc = BigInt(monthSummary.totalIncome || '0');
    const totalExp = BigInt(monthSummary.totalExpense || '0');

    if (totalInc > 0n) {
      if (totalExp > totalInc) {
        insights.push({
          id: 'savings-deficit',
          type: 'savings_milestone',
          severity: 'alert',
          titleBn: 'বাজেট ঘাটতি সতর্কতা',
          titleEn: 'Monthly Budget Deficit',
          descriptionBn: 'এই মাসে খরচের পরিমাণ মোট আয়কে ছাড়িয়ে গেছে। সঞ্চয় বজায় রাখতে অপ্রয়োজনীয় খরচ পর্যালোচনা করুন।',
          descriptionEn: 'Total expenditure has exceeded your monthly income. Review non-essential spending to stay balanced.',
          metric: 'ঘাটতি',
          metricEn: 'Deficit',
        });
      } else {
        const savingsRate = Math.round(Number(((totalInc - totalExp) * 100n) / totalInc));
        if (savingsRate >= 20) {
          insights.push({
            id: 'savings-good',
            type: 'savings_milestone',
            severity: 'success',
            titleBn: 'চমৎকার সঞ্চয়ের হার!',
            titleEn: 'Great Savings Rate!',
            descriptionBn: `এই মাসে আপনার সঞ্চয়ের হার ${toBengaliDigits(savingsRate)}%, যা আদর্শ লক্ষ্যমাত্রার চেয়েও প্রশংসনীয়।`,
            descriptionEn: `Your savings rate is ${savingsRate}%, outperforming the healthy 20% financial benchmark.`,
            metric: `${savingsRate}%`, metricEn: `${savingsRate}%`,
          });
        }
      }
    }

    // 7. Imminent Recurring Bills (Due in 5 days)
    const allRules = await recurringService.getUserRules(userId);
    const activeRules = allRules.filter((r) => r.active);

    for (const rule of activeRules) {
      const daysDiff = Math.round(
        (new Date(rule.nextDueOn).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff >= 0 && daysDiff <= 5) {
        insights.push({
          id: `bill-${rule.id}`,
          type: 'bill_reminder',
          severity: daysDiff <= 2 ? 'alert' : 'info',
          titleBn: `আসন্ন বিল: ${rule.categoryName || 'বিল'}`,
          titleEn: `Upcoming Bill: ${rule.categoryName || 'Bill'}`,
          descriptionBn: `আগামী ${daysDiff === 0 ? 'আজকেই' : toBengaliDigits(daysDiff) + ' দিনের মধ্যে'} '${rule.categoryName}' বিল পরিশোধ করার সময় আসছে।`,
          descriptionEn: `'${rule.categoryName}' recurring bill is due ${daysDiff === 0 ? 'today' : `in ${daysDiff} days`}.`,
          metric: daysDiff === 0 ? 'আজ' : `${daysDiff} দিন বাকি`,
          metricEn: daysDiff === 0 ? 'Today' : `${daysDiff} day${daysDiff === 1 ? '' : 's'} left`,
        });
      }
    }

    // 8. Dominant Expense Category
    if (currentMonthExpenses.length > 0 && totalExp > 0n) {
      const top = currentMonthExpenses[0];
      const topAmt = BigInt(top.amount || '0');
      const topPct = Math.round(Number((topAmt * 100n) / totalExp));
      if (topPct >= 40 && topAmt >= 50000n) {
        insights.push({
          id: `top-leak-${top.categoryId}`,
          type: 'top_expense',
          severity: 'info',
          titleBn: `একক খাতে সর্বোচ্চ ব্যয়: ${top.categoryName}`,
          titleEn: `Primary Expense: ${top.categoryName}`,
          descriptionBn: `এই মাসের মোট খরচের প্রায় ${toBengaliDigits(topPct)}% একা '${top.categoryName}' খাতেই হয়েছে।`,
          descriptionEn: `Approximately ${topPct}% of your total expenditure this month was in '${top.categoryName}'.`,
          metric: `${topPct}%`, metricEn: `${topPct}%`,
          categoryId: top.categoryId || undefined,
        });
      }
    }

    return insights;
  }
}

export const reportsService = new ReportsService();
