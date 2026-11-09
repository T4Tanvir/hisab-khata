import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { categories, transactions, budgets, recurringRules } from '../../db/schema';
import { AppError } from '../../lib/errors';
import type { CreateCategoryInput, UpdateCategoryInput, CategoryType } from '@hisab/shared';

export class CategoriesService {
  async getUserCategories(userId: string, type?: CategoryType) {
    const conditions = [eq(categories.userId, userId), eq(categories.archived, false)];
    if (type) {
      conditions.push(eq(categories.type, type));
    }

    const list = await db
      .select({
        id: categories.id,
        userId: categories.userId,
        name: categories.name,
        type: categories.type,
        shortLabel: categories.shortLabel,
        color: categories.color,
        archived: categories.archived,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(and(...conditions))
      .orderBy(categories.createdAt);

    return list.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async getCategoryById(userId: string, categoryId: string) {
    const [cat] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (!cat) return null;

    return {
      ...cat,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    };
  }

  async createCategory(userId: string, input: CreateCategoryInput) {
    const [created] = await db
      .insert(categories)
      .values({
        userId,
        name: input.name,
        type: input.type,
        shortLabel: input.shortLabel,
        color: input.color,
      })
      .returning();

    return {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateCategory(userId: string, categoryId: string, input: UpdateCategoryInput) {
    const existing = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    // Changing income <-> expense would silently re-classify every transaction
    // and budget already recorded under this category, so only allow it when unused.
    if (input.type !== undefined && input.type !== existing[0].type) {
      if (await this.isCategoryInUse(categoryId)) {
        throw new AppError(
          'এই ক্যাটাগরিতে লেনদেন বা বাজেট আছে, তাই এর ধরন (আয়/খরচ) পরিবর্তন করা যাবে না। নতুন একটি ক্যাটাগরি তৈরি করুন।',
          409,
          'CATEGORY_TYPE_LOCKED'
        );
      }
    }

    const updateData: Partial<typeof categories.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.shortLabel !== undefined) updateData.shortLabel = input.shortLabel;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.archived !== undefined) updateData.archived = input.archived;

    const [updated] = await db
      .update(categories)
      .set(updateData)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .returning();

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteCategory(userId: string, categoryId: string) {
    const existing = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    if (await this.isCategoryInUse(categoryId)) {
      // Archive to preserve transaction history and budget history
      await db
        .update(categories)
        .set({ archived: true, updatedAt: new Date() })
        .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));
      return { success: true, archived: true };
    }

    // Safe to delete permanently
    await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

    return { success: true, archived: false };
  }

  /** True when any transaction or budget references this category. */
  private async isCategoryInUse(categoryId: string): Promise<boolean> {
    const [txCheck] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(eq(transactions.categoryId, categoryId));

    const [budgetCheck] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(budgets)
      .where(eq(budgets.categoryId, categoryId));

    // Recurring rules reference categories with ON DELETE RESTRICT
    const [ruleCheck] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(recurringRules)
      .where(eq(recurringRules.categoryId, categoryId));

    return (txCheck?.count ?? 0) > 0 || (budgetCheck?.count ?? 0) > 0 || (ruleCheck?.count ?? 0) > 0;
  }
}

export const categoriesService = new CategoriesService();
