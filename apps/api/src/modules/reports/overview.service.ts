import { and, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { budgets, categories, transactions } from '../../db/schema';
import { transactionsService } from '../transactions/transactions.service';
import {
  getDhakaMonth,
  monthDateRange,
  type ReportCategory,
  type ReportMonth,
  type ReportOverview,
  type ReportPeriod,
  type ReportPeriodTotals,
} from '@hisab/shared';

/** YYYY-MM shifted by `delta` months. */
function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

/** Inclusive list of months from `start` to `end`. */
function monthList(start: string, end: string): string[] {
  const out: string[] = [];
  for (let m = start; m <= end; m = addMonths(m, 1)) out.push(m);
  return out;
}

function periodStart(period: ReportPeriod, end: string): string {
  if (period === 'ytd') return `${end.slice(0, 4)}-01`;
  return addMonths(end, -(Number(period) - 1));
}

const rate = (income: bigint, savings: bigint): number | null =>
  income > 0n ? Math.round(Number((savings * 1000n) / income)) / 10 : null;

/** Month key of occurred_on, computed in SQL (occurred_on is a plain DATE). */
const monthKey = sql<string>`to_char(${transactions.occurredOn}, 'YYYY-MM')`;

export class ReportOverviewService {
  /**
   * Everything the report page needs for one period, in a handful of queries:
   * totals (+ the same-length previous period), monthly income/expense/savings,
   * spending by category × month with budget comparison, and the largest expenses.
   * Loans, transfers and goal savings are not income/expense and are excluded.
   */
  async getOverview(userId: string, period: ReportPeriod, endMonth?: string): Promise<ReportOverview> {
    const currentMonth = getDhakaMonth();
    const end = endMonth ?? currentMonth;
    const start = periodStart(period, end);
    const months = monthList(start, end);
    const prevEnd = addMonths(start, -1);
    const prevStart = addMonths(prevEnd, -(months.length - 1));

    const rangeStart = monthDateRange(start).start;
    const rangeEnd = monthDateRange(end).end;

    // 1. Income / expense per month for the period AND the previous period (one query)
    const monthlyRows = await db
      .select({
        month: monthKey,
        type: transactions.type,
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          inArray(transactions.type, ['income', 'expense']),
          gte(transactions.occurredOn, monthDateRange(prevStart).start),
          lt(transactions.occurredOn, rangeEnd)
        )
      )
      .groupBy(monthKey, transactions.type);

    const byMonth = new Map<string, { income: bigint; expense: bigint }>();
    for (const r of monthlyRows) {
      const entry = byMonth.get(r.month) ?? { income: 0n, expense: 0n };
      entry[r.type as 'income' | 'expense'] += BigInt(r.total);
      byMonth.set(r.month, entry);
    }

    const monthly: ReportMonth[] = months.map((month) => {
      const { income, expense } = byMonth.get(month) ?? { income: 0n, expense: 0n };
      const savings = income - expense;
      return {
        month,
        income: income.toString(),
        expense: expense.toString(),
        savings: savings.toString(),
        savingsRate: rate(income, savings),
      };
    });

    const totals = this.totalsFor(months, byMonth, currentMonth);
    const previous = this.totalsFor(monthList(prevStart, prevEnd), byMonth, currentMonth);

    // 2. Expense by category × month
    const catRows = await db
      .select({
        categoryId: transactions.categoryId,
        month: monthKey,
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
        count: sql<number>`count(*)::int`,
        name: categories.name,
        shortLabel: categories.shortLabel,
        color: categories.color,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.occurredOn, rangeStart),
          lt(transactions.occurredOn, rangeEnd)
        )
      )
      .groupBy(transactions.categoryId, monthKey, categories.name, categories.shortLabel, categories.color);

    // 3. Budgets per category × month in the period (amount 0 = "no budget")
    const budgetRows = await db
      .select({ categoryId: budgets.categoryId, month: budgets.month, amount: budgets.amount })
      .from(budgets)
      .where(and(eq(budgets.userId, userId), inArray(budgets.month, months), sql`${budgets.amount} > 0`));

    const budgetMap = new Map<string, Map<string, bigint>>();
    for (const b of budgetRows) {
      const perMonth = budgetMap.get(b.categoryId) ?? new Map<string, bigint>();
      perMonth.set(b.month, b.amount);
      budgetMap.set(b.categoryId, perMonth);
    }

    const totalExpense = BigInt(totals.expense);
    const catMap = new Map<string, ReportCategory & { _byMonth: Map<string, bigint>; _total: bigint }>();
    for (const r of catRows) {
      if (!r.categoryId) continue;
      const entry =
        catMap.get(r.categoryId) ??
        ({
          categoryId: r.categoryId,
          name: r.name,
          shortLabel: r.shortLabel,
          color: r.color,
          total: '0',
          share: 0,
          txCount: 0,
          byMonth: [],
          budget: null,
          budgetSpent: null,
          _byMonth: new Map(),
          _total: 0n,
        } as ReportCategory & { _byMonth: Map<string, bigint>; _total: bigint });
      const amount = BigInt(r.total);
      entry._byMonth.set(r.month, amount);
      entry._total += amount;
      entry.txCount += r.count;
      catMap.set(r.categoryId, entry);
    }

    const categoryList: ReportCategory[] = [...catMap.values()]
      .map(({ _byMonth, _total, ...c }) => {
        const perMonthBudget = budgetMap.get(c.categoryId);
        let budget: bigint | null = null;
        let budgetSpent: bigint | null = null;
        if (perMonthBudget && perMonthBudget.size > 0) {
          budget = 0n;
          budgetSpent = 0n;
          for (const [month, amount] of perMonthBudget) {
            budget += amount;
            budgetSpent += _byMonth.get(month) ?? 0n;
          }
        }
        return {
          ...c,
          total: _total.toString(),
          share: totalExpense > 0n ? Math.round(Number((_total * 1000n) / totalExpense)) / 10 : 0,
          byMonth: months.map((m) => (_byMonth.get(m) ?? 0n).toString()),
          budget: budget?.toString() ?? null,
          budgetSpent: budgetSpent?.toString() ?? null,
        };
      })
      .sort((a, b) => (BigInt(b.total) > BigInt(a.total) ? 1 : BigInt(b.total) < BigInt(a.total) ? -1 : 0));

    // 4. Largest single expenses in the period
    const topExpenses = await transactionsService.getTransactionsBetween(userId, rangeStart, rangeEnd, {
      type: 'expense',
      orderBy: 'amount',
      limit: 5,
    });

    return {
      period,
      currentMonth,
      months,
      totals,
      previous,
      monthly,
      categories: categoryList,
      topExpenses,
    };
  }

  private totalsFor(
    months: string[],
    byMonth: Map<string, { income: bigint; expense: bigint }>,
    currentMonth: string
  ): ReportPeriodTotals {
    let income = 0n;
    let expense = 0n;
    for (const m of months) {
      income += byMonth.get(m)?.income ?? 0n;
      expense += byMonth.get(m)?.expense ?? 0n;
    }

    // Average over complete months: skip the running month (and future ones) when
    // the period has other months, so a half-finished month doesn't drag it down.
    const complete = months.filter((m) => m < currentMonth);
    const avgMonths = complete.length > 0 ? complete : months.filter((m) => m <= currentMonth);
    let avgExpense = 0n;
    for (const m of avgMonths) avgExpense += byMonth.get(m)?.expense ?? 0n;

    const savings = income - expense;
    return {
      startMonth: months[0],
      endMonth: months[months.length - 1],
      income: income.toString(),
      expense: expense.toString(),
      savings: savings.toString(),
      savingsRate: rate(income, savings),
      avgMonthlyExpense: avgMonths.length > 0 ? (avgExpense / BigInt(avgMonths.length)).toString() : '0',
      avgMonthsCount: avgMonths.length,
    };
  }
}

export const reportOverviewService = new ReportOverviewService();
