import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { budgets, categories, transactions } from '../../db/schema';
import { takaToPaisa, type Budget, type SetBudgetInput } from '@hisab/shared';

export interface BudgetSummary {
  month: string;
  totalBudget: string;
  totalSpent: string;
  remainingBudget: string;
  percentage: number;
  overBudgetCount: number;
  warningCount: number;
  onTrackCount: number;
  totalCategories: number;
  budgetedCategoriesCount: number;
}

export class BudgetsService {
  /**
   * Retrieves all expense categories and their budget status for the given month.
   * If no budgets exist for this month, auto-copies from the previous month.
   */
  async getBudgets(userId: string, month: string): Promise<Budget[]> {
    // 1. Auto-copy from previous month if no budgets exist for this month
    const existingCount = await db
      .select({ count: sql<string>`COUNT(*)` })
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.month, month)));

    if (parseInt(existingCount[0]?.count || '0', 10) === 0) {
      const [y, m] = month.split('-').map(Number);
      const prevDate = new Date(Date.UTC(y, m - 2, 1));
      const prevMonth = prevDate.toISOString().slice(0, 7);

      const prevBudgets = await db
        .select()
        .from(budgets)
        .where(and(eq(budgets.userId, userId), eq(budgets.month, prevMonth)));

      if (prevBudgets.length > 0) {
        await db.insert(budgets).values(
          prevBudgets.map((b) => ({
            userId,
            categoryId: b.categoryId,
            month,
            amount: b.amount,
          }))
        );
      }
    }

    // 2. Fetch all active expense categories for this user
    const expenseCategories = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          eq(categories.type, 'expense'),
          eq(categories.archived, false)
        )
      )
      .orderBy(categories.name);

    if (expenseCategories.length === 0) {
      return [];
    }

    // 3. Fetch budgets set for this month
    const monthBudgets = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.month, month)));

    const budgetMap = new Map<string, typeof monthBudgets[0]>();
    for (const b of monthBudgets) {
      budgetMap.set(b.categoryId, b);
    }

    // 4. Fetch actual spent amounts per category in this month
    const categorySpent = await db
      .select({
        categoryId: transactions.categoryId,
        totalSpent: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          sql`${transactions.occurredOn}::text LIKE ${month + '%'}`
        )
      )
      .groupBy(transactions.categoryId);

    const spentMap = new Map<string, bigint>();
    for (const s of categorySpent) {
      if (s.categoryId) {
        spentMap.set(s.categoryId, BigInt(s.totalSpent || '0'));
      }
    }

    // 5. Construct Budget objects
    return expenseCategories.map((cat) => {
      const b = budgetMap.get(cat.id);
      const spent = spentMap.get(cat.id) || 0n;
      const budgetAmt = b ? BigInt(b.amount) : 0n;

      let percentage = 0;
      let status: 'ok' | 'warning' | 'exceeded' = 'ok';

      if (budgetAmt > 0n) {
        percentage = Math.round(Number((spent * 100n) / budgetAmt));
        if (percentage >= 100) {
          status = 'exceeded';
        } else if (percentage >= 80) {
          status = 'warning';
        }
      }

      const remaining = budgetAmt - spent;

      return {
        id: b?.id || `cat-${cat.id}`,
        userId,
        categoryId: cat.id,
        categoryName: cat.name,
        categoryShortLabel: cat.shortLabel,
        categoryColor: cat.color,
        month,
        amount: budgetAmt.toString(),
        spentAmount: spent.toString(),
        remainingAmount: remaining.toString(),
        percentage,
        status,
      };
    });
  }

  /**
   * Summary overview for the month (total budget limit, total spent, over budget counts).
   */
  async getBudgetSummary(userId: string, month: string): Promise<BudgetSummary> {
    const list = await this.getBudgets(userId, month);

    let totalBudget = 0n;
    let totalSpent = 0n;
    let overBudgetCount = 0;
    let warningCount = 0;
    let onTrackCount = 0;
    let budgetedCategoriesCount = 0;

    for (const item of list) {
      const bAmt = BigInt(item.amount);
      const sAmt = BigInt(item.spentAmount);

      if (bAmt > 0n) {
        totalBudget += bAmt;
        totalSpent += sAmt;
        budgetedCategoriesCount++;

        if (item.status === 'exceeded') {
          overBudgetCount++;
        } else if (item.status === 'warning') {
          warningCount++;
        } else {
          onTrackCount++;
        }
      }
    }

    const percentage =
      totalBudget > 0n ? Math.round(Number((totalSpent * 100n) / totalBudget)) : 0;
    const remainingBudget = totalBudget - totalSpent;

    return {
      month,
      totalBudget: totalBudget.toString(),
      totalSpent: totalSpent.toString(),
      remainingBudget: remainingBudget.toString(),
      percentage,
      overBudgetCount,
      warningCount,
      onTrackCount,
      totalCategories: list.length,
      budgetedCategoriesCount,
    };
  }

  /**
   * Set or update budget for a category in a month.
   */
  async setBudget(userId: string, categoryId: string, input: SetBudgetInput) {
    // Validate category
    const [cat] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.userId, userId),
          eq(categories.type, 'expense'),
          eq(categories.archived, false)
        )
      )
      .limit(1);

    if (!cat) {
      throw new Error('ক্যাটাগরিটি সঠিক নয় বা খরচ ধরণের নয়');
    }

    const amountPaisa = takaToPaisa(input.amount);

    // If budget amount is 0, delete the budget entry
    if (amountPaisa === 0n) {
      await db
        .delete(budgets)
        .where(
          and(
            eq(budgets.userId, userId),
            eq(budgets.categoryId, categoryId),
            eq(budgets.month, input.month)
          )
        );
      return { success: true, message: 'বাজেট সীমা মুছে ফেলা হয়েছে' };
    }

    // Upsert budget
    const [existing] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.categoryId, categoryId),
          eq(budgets.month, input.month)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(budgets)
        .set({
          amount: amountPaisa,
          updatedAt: new Date(),
        })
        .where(eq(budgets.id, existing.id));
    } else {
      await db.insert(budgets).values({
        userId,
        categoryId,
        month: input.month,
        amount: amountPaisa,
      });
    }

    const allBudgets = await this.getBudgets(userId, input.month);
    return allBudgets.find((b) => b.categoryId === categoryId);
  }

  /**
   * Delete a budget limit for a category in a month.
   */
  async deleteBudget(userId: string, categoryId: string, month: string) {
    const [deleted] = await db
      .delete(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.categoryId, categoryId),
          eq(budgets.month, month)
        )
      )
      .returning({ id: budgets.id });

    return !!deleted;
  }
}

export const budgetsService = new BudgetsService();
