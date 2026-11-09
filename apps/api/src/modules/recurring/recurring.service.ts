import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { recurringRules, wallets, categories, transactions } from '../../db/schema';
import { AppError } from '../../lib/errors';
import { transactionsService } from '../transactions/transactions.service';
import {
  takaToPaisa,
  getDhakaDate,
  addDaysToIsoDate,
  type CreateRecurringInput,
  type UpdateRecurringInput,
  type PayRecurringInput,
  type RecurringRule,
} from '@hisab/shared';

/**
 * Next due date after `current` (YYYY-MM-DD). Pure calendar arithmetic in UTC,
 * so the result does not depend on the server's timezone.
 * Monthly rules keep their target day and clamp to short months
 * (31 → Feb 28 → Mar 31).
 */
export function calculateNextDueDate(
  current: string,
  frequency: 'monthly' | 'weekly',
  targetDay: number
): string {
  if (frequency === 'weekly') return addDaysToIsoDate(current, 7);

  const [y, m] = current.split('-').map(Number);
  const nextMonthIndex = m; // 0-based index of the following month
  const year = y + Math.floor(nextMonthIndex / 12);
  const month = nextMonthIndex % 12;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(targetDay, daysInMonth);
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

interface RuleShape {
  type: 'income' | 'expense';
  walletId: string;
  categoryId: string;
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
      // Join conditions also check ownership so a foreign id can never leak another user's names
      .innerJoin(wallets, and(eq(recurringRules.walletId, wallets.id), eq(wallets.userId, userId)))
      .innerJoin(categories, and(eq(recurringRules.categoryId, categories.id), eq(categories.userId, userId)))
      .where(eq(recurringRules.userId, userId))
      .orderBy(recurringRules.nextDueOn);

    return rows.map((r) => ({
      ...r,
      amount: r.amount.toString(),
      nextDueOn: String(r.nextDueOn),
    }));
  }

  async getRuleById(userId: string, id: string): Promise<RecurringRule | null> {
    const list = await this.getUserRules(userId);
    return list.find((r) => r.id === id) ?? null;
  }

  async createRule(userId: string, input: CreateRecurringInput): Promise<RecurringRule> {
    await this.assertValidShape(userId, input, null);

    const [created] = await db
      .insert(recurringRules)
      .values({
        userId,
        type: input.type,
        amount: takaToPaisa(input.amount),
        walletId: input.walletId,
        categoryId: input.categoryId,
        frequency: input.frequency || 'monthly',
        dayOfMonth: input.dayOfMonth,
        nextDueOn: input.nextDueOn,
        note: input.note?.trim() || null,
        active: true,
      })
      .returning({ id: recurringRules.id });

    return (await this.getRuleById(userId, created.id))!;
  }

  async updateRule(userId: string, id: string, input: UpdateRecurringInput): Promise<RecurringRule | null> {
    const [existing] = await db
      .select()
      .from(recurringRules)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)))
      .limit(1);

    if (!existing) return null;

    const shape: RuleShape = {
      type: input.type ?? existing.type,
      walletId: input.walletId ?? existing.walletId,
      categoryId: input.categoryId ?? existing.categoryId,
    };
    await this.assertValidShape(userId, shape, existing);

    const updateData: Partial<typeof recurringRules.$inferInsert> = {
      ...shape,
      updatedAt: new Date(),
    };
    if (input.amount !== undefined) updateData.amount = takaToPaisa(input.amount);
    if (input.frequency !== undefined) updateData.frequency = input.frequency;
    if (input.dayOfMonth !== undefined) updateData.dayOfMonth = input.dayOfMonth;
    if (input.nextDueOn !== undefined) updateData.nextDueOn = input.nextDueOn;
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
   * Records the payment for the rule's current due date and advances `nextDueOn`.
   * Runs in one DB transaction, and the advance is conditional on the due date we
   * read, so two concurrent clicks can never post the same bill twice.
   */
  async payRule(userId: string, id: string, input: PayRecurringInput) {
    const [rule] = await db
      .select()
      .from(recurringRules)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)))
      .limit(1);

    if (!rule) throw new AppError('নিয়মটি খুঁজে পাওয়া যায়নি', 404, 'RULE_NOT_FOUND');
    if (!rule.active) {
      throw new AppError('নিয়মটি বন্ধ (নিষ্ক্রিয়) আছে, আগে চালু করুন', 409, 'RULE_INACTIVE');
    }

    const walletId = input.walletId || rule.walletId;
    // The wallet must belong to this user (and be active if it is a different one)
    await this.assertWallet(userId, walletId, walletId === rule.walletId);

    const occurredOn = input.occurredOn || getDhakaDate();
    const dueOn = String(rule.nextDueOn);
    const nextDate = calculateNextDueDate(dueOn, rule.frequency, rule.dayOfMonth);

    const txId = await db.transaction(async (tx) => {
      const advanced = await tx
        .update(recurringRules)
        .set({ nextDueOn: nextDate, updatedAt: new Date() })
        .where(and(eq(recurringRules.id, rule.id), eq(recurringRules.nextDueOn, dueOn)))
        .returning({ id: recurringRules.id });

      if (advanced.length === 0) {
        throw new AppError('এই বিলটি ইতিমধ্যে পরিশোধ করা হয়েছে', 409, 'ALREADY_PAID');
      }

      const [created] = await tx
        .insert(transactions)
        .values({
          userId,
          type: rule.type,
          amount: rule.amount,
          walletId,
          categoryId: rule.categoryId,
          recurringRuleId: rule.id,
          occurredOn,
          note: rule.note || null,
        })
        .returning({ id: transactions.id });

      return created.id;
    });

    return {
      transaction: await transactionsService.getTransactionById(userId, txId),
      rule: await this.getRuleById(userId, rule.id),
    };
  }

  // ---------------------------------------------------------------------------

  /** Wallet and category must belong to the user; category type must match the rule type. */
  private async assertValidShape(
    userId: string,
    shape: RuleShape,
    before: { walletId: string; categoryId: string } | null
  ) {
    await this.assertWallet(userId, shape.walletId, before?.walletId === shape.walletId);

    const [cat] = await db
      .select({ type: categories.type, archived: categories.archived })
      .from(categories)
      .where(and(eq(categories.id, shape.categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (!cat || (cat.archived && before?.categoryId !== shape.categoryId)) {
      throw new AppError('ক্যাটাগরিটি পাওয়া যায়নি বা নিষ্ক্রিয়');
    }
    if (cat.type !== shape.type) {
      throw new AppError(
        `নির্বাচিত ক্যাটাগরিটি ${shape.type === 'expense' ? 'খরচ' : 'আয়'} ধরণের হতে হবে`
      );
    }
  }

  private async assertWallet(userId: string, walletId: string, allowArchived: boolean) {
    const [wallet] = await db
      .select({ archived: wallets.archived })
      .from(wallets)
      .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
      .limit(1);

    if (!wallet || (wallet.archived && !allowArchived)) {
      throw new AppError('ওয়ালেটটি পাওয়া যায়নি বা নিষ্ক্রিয়');
    }
  }
}

export const recurringService = new RecurringService();
