import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { recurringRules, wallets, categories, transactions } from '../../db/schema';
import {
  takaToPaisa,
  getDhakaDate,
  type CreateRecurringInput,
  type PayRecurringInput,
  type RecurringRule,
} from '@hisab/shared';

function calculateNextDueDate(currentDateStr: string, frequency: 'monthly' | 'weekly', targetDay: number): string {
  const current = new Date(currentDateStr);
  if (frequency === 'weekly') {
    current.setDate(current.getDate() + 7);
    return current.toISOString().slice(0, 10);
  }

  // Monthly: move to next month
  let year = current.getFullYear();
  let month = current.getMonth() + 1; // 0-indexed to next month
  if (month > 11) {
    year += 1;
    month = 0;
  }

  // Find max days in that month
  const maxDays = new Date(year, month + 1, 0).getDate();
  const day = Math.min(targetDay, maxDays);

  const next = new Date(Date.UTC(year, month, day));
  return next.toISOString().slice(0, 10);
}

export class RecurringService {
  async getUserRules(userId: string): Promise<RecurringRule[]> {
    const rows = await db
      .select({
        id: recurringRules.id,
        userId: recurringRules.userId,
        type: recurringRules.type,
        amount: recurringRules.amount,
        walletId: recurringRules.walletId,
        walletName: wallets.name,
        categoryId: recurringRules.categoryId,
        categoryName: categories.name,
        frequency: recurringRules.frequency,
        dayOfMonth: recurringRules.dayOfMonth,
        nextDueOn: recurringRules.nextDueOn,
        active: recurringRules.active,
        note: recurringRules.note,
      })
      .from(recurringRules)
      .innerJoin(wallets, eq(recurringRules.walletId, wallets.id))
      .innerJoin(categories, eq(recurringRules.categoryId, categories.id))
      .where(eq(recurringRules.userId, userId))
      .orderBy(recurringRules.nextDueOn);

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      type: r.type,
      amount: r.amount.toString(),
      walletId: r.walletId,
      walletName: r.walletName,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      frequency: r.frequency,
      dayOfMonth: r.dayOfMonth,
      nextDueOn: String(r.nextDueOn),
      active: r.active,
      note: r.note,
    }));
  }

  async getRuleById(userId: string, id: string): Promise<RecurringRule | null> {
    const list = await this.getUserRules(userId);
    return list.find((r) => r.id === id) ?? null;
  }

  async createRule(userId: string, input: CreateRecurringInput): Promise<RecurringRule> {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, input.walletId), eq(wallets.userId, userId), eq(wallets.archived, false)))
      .limit(1);

    if (!wallet) throw new Error('ওয়ালেটটি পাওয়া যায়নি');

    const [cat] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId), eq(categories.archived, false)))
      .limit(1);

    if (!cat) throw new Error('ক্যাটাগরিটি পাওয়া যায়নি');

    const amountPaisa = takaToPaisa(input.amount);

    const [created] = await db
      .insert(recurringRules)
      .values({
        userId,
        type: input.type,
        amount: amountPaisa,
        walletId: input.walletId,
        categoryId: input.categoryId,
        frequency: input.frequency || 'monthly',
        dayOfMonth: input.dayOfMonth,
        nextDueOn: input.nextDueOn,
        note: input.note?.trim() || null,
        active: true,
      })
      .returning();

    return (await this.getRuleById(userId, created.id))!;
  }

  async updateRule(
    userId: string,
    id: string,
    input: Partial<CreateRecurringInput> & { active?: boolean }
  ): Promise<RecurringRule | null> {
    const [existing] = await db
      .select()
      .from(recurringRules)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)))
      .limit(1);

    if (!existing) return null;

    const updateData: Partial<typeof recurringRules.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.type) updateData.type = input.type;
    if (input.amount) updateData.amount = takaToPaisa(input.amount);
    if (input.walletId) updateData.walletId = input.walletId;
    if (input.categoryId) updateData.categoryId = input.categoryId;
    if (input.frequency) updateData.frequency = input.frequency;
    if (input.dayOfMonth) updateData.dayOfMonth = input.dayOfMonth;
    if (input.nextDueOn) updateData.nextDueOn = input.nextDueOn;
    if (input.note !== undefined) updateData.note = input.note?.trim() || null;
    if (input.active !== undefined) updateData.active = input.active;

    await db
      .update(recurringRules)
      .set(updateData)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)));

    return this.getRuleById(userId, id);
  }

  async deleteRule(userId: string, id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(recurringRules)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)))
      .returning({ id: recurringRules.id });

    return !!deleted;
  }

  /**
   * Records payment for a recurring rule and advances its nextDueOn date.
   */
  async payRule(userId: string, id: string, input: PayRecurringInput) {
    const [rule] = await db
      .select()
      .from(recurringRules)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)))
      .limit(1);

    if (!rule) throw new Error('নিয়মটি পাওয়া যায়নি');

    const walletId = input.walletId || rule.walletId;
    const occurredOn = input.occurredOn || getDhakaDate();

    // 1. Insert transaction
    const [createdTx] = await db
      .insert(transactions)
      .values({
        userId,
        type: rule.type,
        amount: rule.amount,
        walletId,
        categoryId: rule.categoryId,
        recurringRuleId: rule.id,
        occurredOn,
        note: rule.note || (rule.type === 'expense' ? 'নিয়মিত খরচ পরিশোধ' : 'নিয়মিত আয় জমা'),
      })
      .returning();

    // 2. Advance nextDueOn date
    const nextDate = calculateNextDueDate(
      String(rule.nextDueOn),
      rule.frequency as 'monthly' | 'weekly',
      rule.dayOfMonth
    );

    await db
      .update(recurringRules)
      .set({
        nextDueOn: nextDate,
        updatedAt: new Date(),
      })
      .where(eq(recurringRules.id, rule.id));

    const updatedRule = await this.getRuleById(userId, rule.id);

    return {
      transaction: createdTx,
      rule: updatedRule,
    };
  }
}

export const recurringService = new RecurringService();
