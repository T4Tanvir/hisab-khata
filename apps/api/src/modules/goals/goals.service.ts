import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { goals, transactions, wallets } from '../../db/schema';
import { AppError } from '../../lib/errors';
import {
  takaToPaisa,
  getDhakaDate,
  type CreateGoalInput,
  type UpdateGoalInput,
  type ContributeGoalInput,
  type Goal,
} from '@hisab/shared';

export class GoalsService {
  /**
   * Retrieves all goals for a user with dynamically calculated saved amounts.
   */
  async getUserGoals(userId: string): Promise<Goal[]> {
    const userGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(goals.createdAt);

    if (userGoals.length === 0) {
      return [];
    }

    // Aggregate contributions from transactions for each goal
    const contributions = await db
      .select({
        goalId: transactions.goalId,
        totalSaved: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), sql`${transactions.goalId} IS NOT NULL`))
      .groupBy(transactions.goalId);

    const savedMap = new Map<string, bigint>();
    for (const c of contributions) {
      if (c.goalId) {
        savedMap.set(c.goalId, BigInt(c.totalSaved || '0'));
      }
    }

    return userGoals.map((g) => {
      const saved = savedMap.get(g.id) || 0n;
      const target = BigInt(g.targetAmount);
      const percentage =
        target > 0n ? Math.min(Math.round(Number((saved * 100n) / target)), 100) : 0;

      return {
        id: g.id,
        userId: g.userId,
        name: g.name,
        targetAmount: target.toString(),
        currentAmount: saved.toString(),
        dueMonth: g.dueMonth,
        note: g.note,
        percentage,
        createdAt: g.createdAt.toISOString(),
      };
    });
  }

  async getGoalById(userId: string, id: string): Promise<Goal | null> {
    const list = await this.getUserGoals(userId);
    return list.find((g) => g.id === id) ?? null;
  }

  async createGoal(userId: string, input: CreateGoalInput): Promise<Goal> {
    const targetAmountPaisa = takaToPaisa(input.targetAmount);

    const [created] = await db
      .insert(goals)
      .values({
        userId,
        name: input.name.trim(),
        targetAmount: targetAmountPaisa,
        dueMonth: input.dueMonth || null,
        note: input.note?.trim() || null,
      })
      .returning();

    return {
      id: created.id,
      userId: created.userId,
      name: created.name,
      targetAmount: created.targetAmount.toString(),
      currentAmount: '0',
      dueMonth: created.dueMonth,
      note: created.note,
      percentage: 0,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async updateGoal(userId: string, id: string, input: UpdateGoalInput): Promise<Goal | null> {
    const [existing] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .limit(1);

    if (!existing) return null;

    const updateData: Partial<typeof goals.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.targetAmount !== undefined) updateData.targetAmount = takaToPaisa(input.targetAmount);
    if (input.dueMonth !== undefined) updateData.dueMonth = input.dueMonth ?? null;
    if (input.note !== undefined) updateData.note = input.note?.trim() || null;

    await db
      .update(goals)
      .set(updateData)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)));

    return this.getGoalById(userId, id);
  }

  async deleteGoal(userId: string, id: string): Promise<boolean> {
    // Unlink any transactions associated with this goal
    await db
      .update(transactions)
      .set({ goalId: null })
      .where(and(eq(transactions.userId, userId), eq(transactions.goalId, id)));

    const [deleted] = await db
      .delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning({ id: goals.id });

    return !!deleted;
  }

  /**
   * Contributes money from a wallet towards a goal.
   * Records a transaction with goalId linked.
   */
  async contributeToGoal(
    userId: string,
    goalId: string,
    input: ContributeGoalInput
  ): Promise<{ goal: Goal; transactionId: string }> {
    const goal = await this.getGoalById(userId, goalId);
    if (!goal) {
      throw new AppError('লক্ষ্যটি পাওয়া যায়নি', 404, 'GOAL_NOT_FOUND');
    }

    // Validate wallet
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, input.walletId), eq(wallets.userId, userId), eq(wallets.archived, false)))
      .limit(1);

    if (!wallet) {
      throw new AppError('ওয়ালেটটি পাওয়া যায়নি বা নিষ্ক্রিয়');
    }

    const amountPaisa = takaToPaisa(input.amount);

    // Insert transaction
    const [createdTx] = await db
      .insert(transactions)
      .values({
        userId,
        // Saving moves money out of the wallet into the goal; it is NOT an expense,
        // so it never inflates expense totals, budgets or reports.
        type: 'saving',
        amount: amountPaisa,
        walletId: input.walletId,
        goalId: goal.id,
        occurredOn: getDhakaDate(),
        note: null, // labelled client-side from goalName
      })
      .returning();

    const updatedGoal = (await this.getGoalById(userId, goalId))!;

    return {
      goal: updatedGoal,
      transactionId: createdTx.id,
    };
  }
}

export const goalsService = new GoalsService();
