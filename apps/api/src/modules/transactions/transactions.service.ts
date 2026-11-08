import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../db/client';
import { transactions, wallets, categories, budgets } from '../../db/schema';
import {
  takaToPaisa,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionFilterInput,
  type Transaction,
} from '@hisab/shared';

export interface BudgetAlert {
  categoryId: string;
  categoryName: string;
  budgetAmount: string;
  spentAmount: string;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
  message: string;
}

export class TransactionsService {
  /**
   * Fetch list of transactions with joined wallet and category information.
   */
  async getTransactions(
    userId: string,
    filters: TransactionFilterInput = { limit: 50 }
  ): Promise<Transaction[]> {
    const whereConditions: SQL[] = [eq(transactions.userId, userId)];

    if (filters.type) {
      whereConditions.push(eq(transactions.type, filters.type));
    }

    if (filters.categoryId) {
      whereConditions.push(eq(transactions.categoryId, filters.categoryId));
    }

    if (filters.walletId) {
      const condition = or(
        eq(transactions.walletId, filters.walletId),
        eq(transactions.toWalletId, filters.walletId)
      );
      if (condition) {
        whereConditions.push(condition);
      }
    }

    if (filters.month) {
      whereConditions.push(sql`${transactions.occurredOn}::text LIKE ${filters.month + '%'}`);
    }

    if (filters.q && filters.q.trim()) {
      whereConditions.push(ilike(transactions.note, `%${filters.q.trim()}%`));
    }

    const toWallets = alias(wallets, 'to_wallets');

    const rows = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        walletId: transactions.walletId,
        walletName: wallets.name,
        toWalletId: transactions.toWalletId,
        toWalletName: toWallets.name,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryShortLabel: categories.shortLabel,
        categoryColor: categories.color,
        occurredOn: transactions.occurredOn,
        note: transactions.note,
        recurringRuleId: transactions.recurringRuleId,
        goalId: transactions.goalId,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .innerJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(toWallets, eq(transactions.toWalletId, toWallets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt))
      .limit(filters.limit || 50);

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      type: r.type,
      amount: r.amount.toString(),
      walletId: r.walletId,
      walletName: r.walletName,
      toWalletId: r.toWalletId,
      toWalletName: r.toWalletName,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryShortLabel: r.categoryShortLabel,
      categoryColor: r.categoryColor,
      occurredOn: String(r.occurredOn),
      note: r.note,
      recurringRuleId: r.recurringRuleId,
      goalId: r.goalId,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    }));
  }

  /**
   * Get single transaction by ID.
   */
  async getTransactionById(userId: string, id: string): Promise<Transaction | null> {
    const toWallets = alias(wallets, 'to_wallets');

    const [row] = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        walletId: transactions.walletId,
        walletName: wallets.name,
        toWalletId: transactions.toWalletId,
        toWalletName: toWallets.name,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryShortLabel: categories.shortLabel,
        categoryColor: categories.color,
        occurredOn: transactions.occurredOn,
        note: transactions.note,
        recurringRuleId: transactions.recurringRuleId,
        goalId: transactions.goalId,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .innerJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(toWallets, eq(transactions.toWalletId, toWallets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      amount: row.amount.toString(),
      walletId: row.walletId,
      walletName: row.walletName,
      toWalletId: row.toWalletId,
      toWalletName: row.toWalletName,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      categoryShortLabel: row.categoryShortLabel,
      categoryColor: row.categoryColor,
      occurredOn: String(row.occurredOn),
      note: row.note,
      recurringRuleId: row.recurringRuleId,
      goalId: row.goalId,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    };
  }

  /**
   * Get month income, expense, net balance and count summary.
   */
  async getMonthSummary(userId: string, month: string) {
    const [summaryResult] = await db
      .select({
        totalIncome: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
        totalExpense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`${transactions.occurredOn}::text LIKE ${month + '%'}`
        )
      );

    const inc = BigInt(summaryResult?.totalIncome || '0');
    const exp = BigInt(summaryResult?.totalExpense || '0');
    const net = inc - exp;

    return {
      month,
      totalIncome: inc.toString(),
      totalExpense: exp.toString(),
      netSavings: net.toString(),
      count: parseInt(summaryResult?.count || '0', 10),
    };
  }

  /**
   * Create a new transaction with wallet & category validation and budget warning check.
   */
  async createTransaction(userId: string, input: CreateTransactionInput) {
    // 1. Validate source wallet
    const [sourceWallet] = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, input.walletId), eq(wallets.userId, userId), eq(wallets.archived, false)))
      .limit(1);

    if (!sourceWallet) {
      throw new Error('ওয়ালেটটি পাওয়া যায়নি বা নিষ্ক্রিয়');
    }

    // 2. Validate transfer destination
    if (input.type === 'transfer') {
      if (!input.toWalletId || input.toWalletId === input.walletId) {
        throw new Error('ভিন্ন একটি গ্রহণকারী ওয়ালেট নির্বাচন করুন');
      }
      const [destWallet] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.id, input.toWalletId), eq(wallets.userId, userId), eq(wallets.archived, false)))
        .limit(1);

      if (!destWallet) {
        throw new Error('গ্রহণকারী ওয়ালেটটি পাওয়া যায়নি বা নিষ্ক্রিয়');
      }
    } else {
      // 3. Validate category for income/expense
      if (!input.categoryId) {
        throw new Error('ক্যাটাগরি নির্বাচন করুন');
      }
      const [cat] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId), eq(categories.archived, false)))
        .limit(1);

      if (!cat) {
        throw new Error('ক্যাটাগরি পাওয়া যায়নি বা নিষ্ক্রিয়');
      }

      if (cat.type !== input.type) {
        throw new Error(`নির্বাচিত ক্যাটাগরিটি ${cat.type === 'expense' ? 'খরচ' : 'আয়'} ধরণের হতে হবে`);
      }
    }

    // Convert amount to poisha (BigInt)
    const amountPaisa = takaToPaisa(input.amount);

    const [created] = await db
      .insert(transactions)
      .values({
        userId,
        type: input.type,
        amount: amountPaisa,
        walletId: input.walletId,
        toWalletId: input.type === 'transfer' ? input.toWalletId : null,
        categoryId: input.type !== 'transfer' ? input.categoryId : null,
        occurredOn: input.occurredOn,
        note: input.note?.trim() || null,
        recurringRuleId: input.recurringRuleId || null,
        goalId: input.goalId || null,
      })
      .returning();

    // 4. Budget Alert Check (if expense)
    let budgetAlert: BudgetAlert | null = null;
    if (input.type === 'expense' && input.categoryId) {
      const month = input.occurredOn.slice(0, 7);
      const [budgetRecord] = await db
        .select({
          id: budgets.id,
          amount: budgets.amount,
          categoryName: categories.name,
        })
        .from(budgets)
        .innerJoin(categories, eq(budgets.categoryId, categories.id))
        .where(
          and(
            eq(budgets.userId, userId),
            eq(budgets.categoryId, input.categoryId),
            eq(budgets.month, month)
          )
        )
        .limit(1);

      if (budgetRecord) {
        const [spentRes] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              eq(transactions.categoryId, input.categoryId),
              eq(transactions.type, 'expense'),
              sql`${transactions.occurredOn}::text LIKE ${month + '%'}`
            )
          );

        const totalSpent = BigInt(spentRes?.total || '0');
        const budgetAmount = BigInt(budgetRecord.amount);
        const percentage = Number((totalSpent * 100n) / (budgetAmount > 0n ? budgetAmount : 1n));

        if (percentage >= 100) {
          budgetAlert = {
            categoryId: input.categoryId,
            categoryName: budgetRecord.categoryName,
            budgetAmount: budgetRecord.amount.toString(),
            spentAmount: totalSpent.toString(),
            percentage,
            status: 'exceeded',
            message: `সতর্কতা: "${budgetRecord.categoryName}" ক্যাটাগরির বাজেট ${Math.round(percentage)}% অতিক্রম করেছে!`,
          };
        } else if (percentage >= 80) {
          budgetAlert = {
            categoryId: input.categoryId,
            categoryName: budgetRecord.categoryName,
            budgetAmount: budgetRecord.amount.toString(),
            spentAmount: totalSpent.toString(),
            percentage,
            status: 'warning',
            message: `সতর্কতা: "${budgetRecord.categoryName}" ক্যাটাগরির বাজেটের ${Math.round(percentage)}% খরচ হয়ে গেছে।`,
          };
        }
      }
    }

    const fullTx = await this.getTransactionById(userId, created.id);

    return {
      transaction: fullTx!,
      budgetAlert,
    };
  }

  /**
   * Update transaction details.
   */
  async updateTransaction(userId: string, id: string, input: UpdateTransactionInput) {
    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    if (!existing) return null;

    if (input.walletId && input.walletId !== existing.walletId) {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.id, input.walletId), eq(wallets.userId, userId), eq(wallets.archived, false)))
        .limit(1);
      if (!wallet) throw new Error('নতুন ওয়ালেটটি সঠিক নয়');
    }

    if (input.toWalletId && input.toWalletId !== existing.toWalletId) {
      const [toWallet] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.id, input.toWalletId), eq(wallets.userId, userId), eq(wallets.archived, false)))
        .limit(1);
      if (!toWallet) throw new Error('নতুন গ্রহণকারী ওয়ালেটটি সঠিক নয়');
    }

    if (input.categoryId && input.categoryId !== existing.categoryId) {
      const [cat] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId), eq(categories.archived, false)))
        .limit(1);
      if (!cat) throw new Error('নতুন ক্যাটাগরিটি সঠিক নয়');
    }

    const updateData: Partial<typeof transactions.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.amount !== undefined) {
      updateData.amount = takaToPaisa(input.amount);
    }
    if (input.walletId !== undefined) {
      updateData.walletId = input.walletId;
    }
    if (input.toWalletId !== undefined) {
      updateData.toWalletId = input.toWalletId;
    }
    if (input.categoryId !== undefined) {
      updateData.categoryId = input.categoryId;
    }
    if (input.occurredOn !== undefined) {
      updateData.occurredOn = input.occurredOn;
    }
    if (input.note !== undefined) {
      updateData.note = input.note?.trim() || null;
    }

    await db
      .update(transactions)
      .set(updateData)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    return this.getTransactionById(userId, id);
  }

  /**
   * Delete transaction.
   */
  async deleteTransaction(userId: string, id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning({ id: transactions.id });

    return !!deleted;
  }
}

export const transactionsService = new TransactionsService();
