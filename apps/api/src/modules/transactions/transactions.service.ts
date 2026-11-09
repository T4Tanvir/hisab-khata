import { and, desc, eq, gte, ilike, lt, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../db/client';
import { transactions, wallets, categories, budgets, loans, goals } from '../../db/schema';
import { AppError } from '../../lib/errors';
import {
  takaToPaisa,
  monthDateRange,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionFilterInput,
  type Transaction,
  type TransactionType,
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

/** The fields that decide whether a transaction is internally consistent. */
interface TransactionShape {
  type: TransactionType;
  walletId: string;
  toWalletId: string | null;
  categoryId: string | null;
}

/** SQL condition: occurred_on falls inside the given YYYY-MM month (index friendly). */
function inMonth(month: string): SQL {
  const { start, end } = monthDateRange(month);
  return and(gte(transactions.occurredOn, start), lt(transactions.occurredOn, end))!;
}

/** Escape LIKE wildcards so user search text is matched literally. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

const toWallets = alias(wallets, 'to_wallets');

function selectTransactionsWithJoins() {
  return db
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
      loanId: transactions.loanId,
      // Names for loan / saving rows, so the client can build a label in the user's language
      loanPersonName: loans.personName,
      loanDirection: loans.direction,
      goalName: goals.name,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(wallets, eq(transactions.walletId, wallets.id))
    .leftJoin(toWallets, eq(transactions.toWalletId, toWallets.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(loans, eq(transactions.loanId, loans.id))
    .leftJoin(goals, eq(transactions.goalId, goals.id));
}

type JoinedRow = Awaited<ReturnType<typeof selectTransactionsWithJoins>>[number];

function toTransaction(r: JoinedRow): Transaction {
  return {
    ...r,
    amount: r.amount.toString(),
    occurredOn: String(r.occurredOn),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
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
      whereConditions.push(
        or(eq(transactions.walletId, filters.walletId), eq(transactions.toWalletId, filters.walletId))!
      );
    }

    if (filters.month) {
      whereConditions.push(inMonth(filters.month));
    }

    const q = filters.q?.trim();
    if (q) {
      whereConditions.push(ilike(transactions.note, `%${escapeLike(q)}%`));
    }

    const rows = await selectTransactionsWithJoins()
      .where(and(...whereConditions))
      .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt))
      .limit(filters.limit || 50);

    return rows.map(toTransaction);
  }

  /**
   * Transactions with occurred_on in [startDate, endDate) — used by reports.
   * `orderBy: 'amount'` returns the largest first (e.g. top expenses).
   */
  async getTransactionsBetween(
    userId: string,
    startDate: string,
    endDate: string,
    opts: { type?: TransactionType; orderBy?: 'date' | 'amount'; limit?: number } = {}
  ): Promise<Transaction[]> {
    const conditions: SQL[] = [
      eq(transactions.userId, userId),
      gte(transactions.occurredOn, startDate),
      lt(transactions.occurredOn, endDate),
    ];
    if (opts.type) conditions.push(eq(transactions.type, opts.type));

    const ordered = selectTransactionsWithJoins()
      .where(and(...conditions))
      .orderBy(
        ...(opts.orderBy === 'amount'
          ? [desc(transactions.amount), desc(transactions.occurredOn)]
          : [desc(transactions.occurredOn), desc(transactions.createdAt)])
      );

    const rows = await (opts.limit ? ordered.limit(opts.limit) : ordered);
    return rows.map(toTransaction);
  }

  /**
   * Get single transaction by ID.
   */
  async getTransactionById(userId: string, id: string): Promise<Transaction | null> {
    const [row] = await selectTransactionsWithJoins()
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    return row ? toTransaction(row) : null;
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
      .where(and(eq(transactions.userId, userId), inMonth(month)));

    const inc = BigInt(summaryResult?.totalIncome || '0');
    const exp = BigInt(summaryResult?.totalExpense || '0');

    return {
      month,
      totalIncome: inc.toString(),
      totalExpense: exp.toString(),
      netSavings: (inc - exp).toString(),
      count: parseInt(summaryResult?.count || '0', 10),
    };
  }

  /**
   * Create a new transaction with wallet & category validation and budget warning check.
   */
  async createTransaction(userId: string, input: CreateTransactionInput) {
    const shape = normalizeShape({
      type: input.type,
      walletId: input.walletId,
      toWalletId: input.toWalletId ?? null,
      categoryId: input.categoryId ?? null,
    });

    await this.assertValidShape(userId, shape, null);

    const [created] = await db
      .insert(transactions)
      .values({
        userId,
        ...shape,
        amount: takaToPaisa(input.amount),
        occurredOn: input.occurredOn,
        note: input.note?.trim() || null,
      })
      .returning({ id: transactions.id });

    const budgetAlert =
      shape.type === 'expense' && shape.categoryId
        ? await this.checkBudget(userId, shape.categoryId, input.occurredOn)
        : null;

    const fullTx = await this.getTransactionById(userId, created.id);

    return { transaction: fullTx!, budgetAlert };
  }

  /**
   * Update transaction details. The merged result (existing + changes) is
   * validated with the same rules as create, so a transaction can never be
   * left in an inconsistent state (e.g. expense with an income category).
   */
  async updateTransaction(userId: string, id: string, input: UpdateTransactionInput) {
    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    if (!existing) return null;

    if (existing.loanId) {
      throw new AppError(
        'ধার-দেনার লেনদেন এখান থেকে পরিবর্তন করা যাবে না। অনুগ্রহ করে ধার-দেনা পেজ ব্যবহার করুন।'
      );
    }

    const before: TransactionShape = {
      type: existing.type,
      walletId: existing.walletId,
      toWalletId: existing.toWalletId,
      categoryId: existing.categoryId,
    };

    const shape = normalizeShape({
      type: existing.type,
      walletId: input.walletId ?? existing.walletId,
      toWalletId: input.toWalletId !== undefined ? input.toWalletId : existing.toWalletId,
      categoryId: input.categoryId !== undefined ? input.categoryId : existing.categoryId,
    });

    await this.assertValidShape(userId, shape, before);

    const updateData: Partial<typeof transactions.$inferInsert> = {
      ...shape,
      updatedAt: new Date(),
    };

    if (input.amount !== undefined) {
      updateData.amount = takaToPaisa(input.amount);
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

    const occurredOn = input.occurredOn ?? String(existing.occurredOn);
    const budgetAlert =
      shape.type === 'expense' && shape.categoryId
        ? await this.checkBudget(userId, shape.categoryId, occurredOn)
        : null;

    const transaction = await this.getTransactionById(userId, id);
    return { transaction: transaction!, budgetAlert };
  }

  /**
   * Delete transaction.
   */
  async deleteTransaction(userId: string, id: string): Promise<boolean> {
    const [existing] = await db
      .select({ id: transactions.id, loanId: transactions.loanId })
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    if (!existing) return false;

    if (existing.loanId) {
      throw new AppError(
        'ধার-দেনার লেনদেন এখান থেকে মোছা যাবে না। অনুগ্রহ করে ধার-দেনা পেজ ব্যবহার করুন।'
      );
    }

    const [deleted] = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning({ id: transactions.id });

    return !!deleted;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Validates wallet/category references for a transaction.
   * `before` is the stored shape when updating: references that did not change
   * are allowed to point at archived wallets/categories (history stays editable),
   * but newly chosen ones must be active.
   */
  private async assertValidShape(
    userId: string,
    shape: TransactionShape,
    before: TransactionShape | null
  ) {
    await this.assertWallet(userId, shape.walletId, before?.walletId === shape.walletId, 'ওয়ালেটটি পাওয়া যায়নি বা নিষ্ক্রিয়');

    // Loan and saving rows only reference a wallet (no category / destination)
    if (shape.type === 'loan_in' || shape.type === 'loan_out' || shape.type === 'saving') {
      return;
    }

    if (shape.type === 'transfer') {
      if (!shape.toWalletId || shape.toWalletId === shape.walletId) {
        throw new AppError('ভিন্ন একটি গ্রহণকারী ওয়ালেট নির্বাচন করুন');
      }
      await this.assertWallet(
        userId,
        shape.toWalletId,
        before?.toWalletId === shape.toWalletId,
        'গ্রহণকারী ওয়ালেটটি পাওয়া যায়নি বা নিষ্ক্রিয়'
      );
      return;
    }

    if (!shape.categoryId) {
      throw new AppError('ক্যাটাগরি নির্বাচন করুন');
    }

    const [cat] = await db
      .select({ type: categories.type, archived: categories.archived })
      .from(categories)
      .where(and(eq(categories.id, shape.categoryId), eq(categories.userId, userId)))
      .limit(1);

    const allowArchived = before?.categoryId === shape.categoryId;
    if (!cat || (cat.archived && !allowArchived)) {
      throw new AppError('ক্যাটাগরি পাওয়া যায়নি বা নিষ্ক্রিয়');
    }

    if (cat.type !== shape.type) {
      throw new AppError(
        `নির্বাচিত ক্যাটাগরিটি ${shape.type === 'expense' ? 'খরচ' : 'আয়'} ধরণের হতে হবে`
      );
    }
  }

  private async assertWallet(userId: string, walletId: string, allowArchived: boolean, message: string) {
    const [wallet] = await db
      .select({ archived: wallets.archived })
      .from(wallets)
      .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
      .limit(1);

    if (!wallet || (wallet.archived && !allowArchived)) {
      throw new AppError(message);
    }
  }

  /** Returns a warning when the category's spending reaches 80% / 100% of its monthly budget. */
  private async checkBudget(
    userId: string,
    categoryId: string,
    occurredOn: string
  ): Promise<BudgetAlert | null> {
    const month = occurredOn.slice(0, 7);
    const [budgetRecord] = await db
      .select({ amount: budgets.amount, categoryName: categories.name })
      .from(budgets)
      .innerJoin(categories, eq(budgets.categoryId, categories.id))
      .where(
        and(eq(budgets.userId, userId), eq(budgets.categoryId, categoryId), eq(budgets.month, month))
      )
      .limit(1);

    if (!budgetRecord || budgetRecord.amount <= 0n) return null;

    const [spentRes] = await db
      .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.categoryId, categoryId),
          eq(transactions.type, 'expense'),
          inMonth(month)
        )
      );

    const totalSpent = BigInt(spentRes?.total || '0');
    const percentage = Number((totalSpent * 100n) / budgetRecord.amount);

    if (percentage < 80) return null;

    const exceeded = percentage >= 100;
    return {
      categoryId,
      categoryName: budgetRecord.categoryName,
      budgetAmount: budgetRecord.amount.toString(),
      spentAmount: totalSpent.toString(),
      percentage,
      status: exceeded ? 'exceeded' : 'warning',
      message: exceeded
        ? `সতর্কতা: "${budgetRecord.categoryName}" ক্যাটাগরির বাজেট ${percentage}% অতিক্রম করেছে!`
        : `সতর্কতা: "${budgetRecord.categoryName}" ক্যাটাগরির বাজেটের ${percentage}% খরচ হয়ে গেছে।`,
    };
  }
}

/** Transfers never carry a category; loans never carry category or destination wallet; income/expense never carry a destination wallet. */
function normalizeShape(shape: TransactionShape): TransactionShape {
  if (shape.type === 'transfer') {
    return { ...shape, categoryId: null };
  }
  if (shape.type === 'loan_in' || shape.type === 'loan_out' || shape.type === 'saving') {
    return { ...shape, toWalletId: null, categoryId: null };
  }
  return { ...shape, toWalletId: null };
}

export const transactionsService = new TransactionsService();
