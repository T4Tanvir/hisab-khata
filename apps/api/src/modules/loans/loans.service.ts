import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { loans, transactions, wallets } from '../../db/schema';
import { AppError } from '../../lib/errors';
import {
  takaToPaisa,
  getDhakaDate,
  type CreateLoanInput,
  type UpdateLoanInput,
  type CreateLoanPaymentInput,
  type LoanFilterInput,
  type Loan,
  type LoanSummary,
  type Transaction,
} from '@hisab/shared';

const notFound = () => new AppError('ধার-দেনার তথ্যটি খুঁজে পাওয়া যায়নি', 404, 'LOAN_NOT_FOUND');

/** Paisa → plain taka string for messages (exact, no float rounding). */
function formatTaka(paisa: bigint): string {
  const whole = paisa / 100n;
  const frac = paisa % 100n;
  return frac === 0n ? whole.toString() : `${whole}.${frac.toString().padStart(2, '0')}`;
}

export class LoansService {
  /**
   * Helper to compute totalPaid and remaining for a loan.
   * - Borrowed (দেনা):
   *   - Initial transaction: loan_in (+ in wallet)
   *   - Repayments (my debt payments): loan_out (- from wallet)
   * - Lent (পাওনা):
   *   - Initial transaction: loan_out (- from wallet)
   *   - Repayments (collected back): loan_in (+ into wallet)
   */
  private calculateLoanMetrics(
    loan: typeof loans.$inferSelect,
    allTx: Array<{ id: string; type: string; amount: bigint; createdAt: Date }>
  ) {
    const principal = BigInt(loan.principal);
    const repaymentType = loan.direction === 'borrowed' ? 'loan_out' : 'loan_in';

    // Sum of repayment transactions
    const totalPaid = allTx
      .filter((t) => t.type === repaymentType)
      .reduce((acc, t) => acc + BigInt(t.amount), 0n);

    const remaining = principal > totalPaid ? principal - totalPaid : 0n;
    const percentage =
      principal > 0n ? Math.min(100, Number((totalPaid * 100n) / principal)) : 100;

    const today = getDhakaDate();
    const isOverdue =
      loan.status === 'active' && !!loan.dueOn && loan.dueOn < today && remaining > 0n;

    return {
      principal: principal.toString(),
      totalPaid: totalPaid.toString(),
      remaining: remaining.toString(),
      percentage,
      isOverdue,
      shouldSettle: loan.status === 'active' && remaining === 0n,
      shouldReopen: loan.status === 'settled' && remaining > 0n,
    };
  }

  /**
   * Get loans list with remaining balance, overdue flag, and progress percentage.
   */
  async getLoans(userId: string, filters: LoanFilterInput = {}): Promise<Loan[]> {
    const conditions = [eq(loans.userId, userId)];

    if (filters.direction) {
      conditions.push(eq(loans.direction, filters.direction));
    }
    if (filters.status) {
      conditions.push(eq(loans.status, filters.status));
    }
    if (filters.q?.trim()) {
      const query = `%${filters.q.trim()}%`;
      conditions.push(
        or(ilike(loans.personName, query), ilike(loans.note, query))!
      );
    }

    const loanList = await db
      .select()
      .from(loans)
      .where(and(...conditions))
      .orderBy(desc(loans.createdAt));

    if (loanList.length === 0) return [];

    // Fetch all transactions linked to these loans
    const loanIds = loanList.map((l) => l.id);
    const allTransactions = await db
      .select({
        id: transactions.id,
        loanId: transactions.loanId,
        type: transactions.type,
        amount: transactions.amount,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`${transactions.loanId} IN ${loanIds}`
        )
      );

    const txByLoanId = new Map<string, typeof allTransactions>();
    for (const tx of allTransactions) {
      if (tx.loanId) {
        const list = txByLoanId.get(tx.loanId) || [];
        list.push(tx);
        txByLoanId.set(tx.loanId, list);
      }
    }

    const result: Loan[] = [];

    for (const loan of loanList) {
      const txs = txByLoanId.get(loan.id) || [];
      const metrics = this.calculateLoanMetrics(loan, txs);

      // Auto-update status if settled or reopened
      let status = loan.status;
      if (metrics.shouldSettle) {
        status = 'settled';
        await db
          .update(loans)
          .set({ status: 'settled', updatedAt: new Date() })
          .where(eq(loans.id, loan.id));
      } else if (metrics.shouldReopen) {
        status = 'active';
        await db
          .update(loans)
          .set({ status: 'active', updatedAt: new Date() })
          .where(eq(loans.id, loan.id));
      }

      result.push({
        id: loan.id,
        userId: loan.userId,
        direction: loan.direction as 'borrowed' | 'lent',
        personName: loan.personName,
        personPhone: loan.personPhone,
        principal: metrics.principal,
        totalPaid: metrics.totalPaid,
        remaining: metrics.remaining,
        percentage: metrics.percentage,
        startedOn: String(loan.startedOn),
        dueOn: loan.dueOn ? String(loan.dueOn) : null,
        note: loan.note,
        status: status as 'active' | 'settled',
        isOverdue: metrics.isOverdue,
        createdAt: loan.createdAt.toISOString(),
        updatedAt: loan.updatedAt.toISOString(),
      });
    }

    return result;
  }

  /**
   * Summary card metrics: total debt remaining, total receivable remaining, and counts.
   */
  async getLoanSummary(userId: string): Promise<LoanSummary> {
    const allLoans = await this.getLoans(userId);

    let totalBorrowedRemaining = 0n;
    let totalLentRemaining = 0n;
    let activeBorrowedCount = 0;
    let activeLentCount = 0;

    for (const l of allLoans) {
      if (l.direction === 'borrowed') {
        if (l.status === 'active') {
          totalBorrowedRemaining += BigInt(l.remaining);
          activeBorrowedCount++;
        }
      } else if (l.direction === 'lent') {
        if (l.status === 'active') {
          totalLentRemaining += BigInt(l.remaining);
          activeLentCount++;
        }
      }
    }

    return {
      totalBorrowedRemaining: totalBorrowedRemaining.toString(),
      totalLentRemaining: totalLentRemaining.toString(),
      activeBorrowedCount,
      activeLentCount,
    };
  }

  /**
   * Get detailed loan with its full payment history transactions.
   */
  async getLoanById(userId: string, loanId: string): Promise<Loan | null> {
    const [loan] = await db
      .select()
      .from(loans)
      .where(and(eq(loans.id, loanId), eq(loans.userId, userId)))
      .limit(1);

    if (!loan) return null;

    // Fetch joined transactions for payment history
    const txRows = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        walletId: transactions.walletId,
        walletName: wallets.name,
        toWalletId: transactions.toWalletId,
        categoryId: transactions.categoryId,
        occurredOn: transactions.occurredOn,
        note: transactions.note,
        loanId: transactions.loanId,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .innerJoin(wallets, eq(transactions.walletId, wallets.id))
      .where(and(eq(transactions.userId, userId), eq(transactions.loanId, loanId)))
      .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt));

    const metrics = this.calculateLoanMetrics(loan, txRows);

    let status = loan.status;
    if (metrics.shouldSettle) {
      status = 'settled';
      await db
        .update(loans)
        .set({ status: 'settled', updatedAt: new Date() })
        .where(eq(loans.id, loan.id));
    }

    const formattedTx: Transaction[] = txRows.map((t) => ({
      id: t.id,
      userId: t.userId,
      type: t.type as any,
      amount: t.amount.toString(),
      walletId: t.walletId,
      walletName: t.walletName,
      toWalletId: t.toWalletId,
      categoryId: t.categoryId,
      occurredOn: String(t.occurredOn),
      note: t.note,
      loanId: t.loanId,
      createdAt: t.createdAt.toISOString(),
    }));

    return {
      id: loan.id,
      userId: loan.userId,
      direction: loan.direction as 'borrowed' | 'lent',
      personName: loan.personName,
      personPhone: loan.personPhone,
      principal: metrics.principal,
      totalPaid: metrics.totalPaid,
      remaining: metrics.remaining,
      percentage: metrics.percentage,
      startedOn: String(loan.startedOn),
      dueOn: loan.dueOn ? String(loan.dueOn) : null,
      note: loan.note,
      status: status as 'active' | 'settled',
      isOverdue: metrics.isOverdue,
      createdAt: loan.createdAt.toISOString(),
      updatedAt: loan.updatedAt.toISOString(),
      transactions: formattedTx,
    };
  }

  /**
   * Create a new loan.
   * If affectWallet is true, insert the initial disbursement transaction atomically.
   */
  async createLoan(userId: string, input: CreateLoanInput): Promise<Loan> {
    const principalPaisa = takaToPaisa(input.principal);

    if (input.affectWallet) {
      if (!input.walletId) {
        throw new AppError('ওয়ালেটে লেনদেন যোগ করার জন্য একটি ওয়ালেট নির্বাচন করুন');
      }
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(
          and(
            eq(wallets.id, input.walletId),
            eq(wallets.userId, userId),
            eq(wallets.archived, false)
          )
        )
        .limit(1);

      if (!wallet) {
        throw new AppError('নির্বাচিত ওয়ালেটটি পাওয়া যায়নি বা নিষ্ক্রিয়');
      }
    }

    const loanId = await db.transaction(async (tx) => {
      const [newLoan] = await tx
        .insert(loans)
        .values({
          userId,
          direction: input.direction,
          personName: input.personName.trim(),
          personPhone: input.personPhone?.trim() || null,
          principal: principalPaisa,
          startedOn: input.startedOn,
          dueOn: input.dueOn || null,
          note: input.note?.trim() || null,
          status: 'active',
        })
        .returning({ id: loans.id });

      if (input.affectWallet && input.walletId) {
        // Initial transaction:
        // - borrowed: money received -> 'loan_in'
        // - lent: money given out -> 'loan_out'
        const initialType = input.direction === 'borrowed' ? 'loan_in' : 'loan_out';
        await tx.insert(transactions).values({
          userId,
          type: initialType,
          amount: principalPaisa,
          walletId: input.walletId,
          occurredOn: input.startedOn,
          // No auto-generated text: the client labels loan rows in the user's language
          note: input.note?.trim() || null,
          loanId: newLoan.id,
        });
      }

      return newLoan.id;
    });

    const created = await this.getLoanById(userId, loanId);
    return created!;
  }

  /**
   * Update loan details.
   * - Principal cannot go below what has already been repaid.
   * - If the loan created a wallet transaction (affectWallet), that disbursement is kept
   *   in sync with the new principal / start date so wallet balances never drift.
   */
  async updateLoan(userId: string, loanId: string, input: UpdateLoanInput): Promise<Loan> {
    const existing = await this.getLoanById(userId, loanId);
    if (!existing) throw notFound();

    const updateData: Partial<typeof loans.$inferInsert> = { updatedAt: new Date() };

    if (input.personName !== undefined) updateData.personName = input.personName.trim();
    if (input.personPhone !== undefined) updateData.personPhone = input.personPhone?.trim() || null;
    if (input.startedOn !== undefined) updateData.startedOn = input.startedOn;
    if (input.dueOn !== undefined) updateData.dueOn = input.dueOn || null;
    if (input.note !== undefined) updateData.note = input.note?.trim() || null;

    const startedOn = updateData.startedOn ?? existing.startedOn;
    const dueOn = input.dueOn !== undefined ? updateData.dueOn : existing.dueOn;
    if (dueOn && dueOn < startedOn) {
      throw new AppError('পরিশোধের শেষ তারিখ শুরুর তারিখের আগে হতে পারে না');
    }

    if (input.principal !== undefined) {
      const newPrincipalPaisa = takaToPaisa(input.principal);
      const totalPaidPaisa = BigInt(existing.totalPaid);

      if (newPrincipalPaisa < totalPaidPaisa) {
        throw new AppError(
          `মূল টাকা ইতিমধ্যে পরিশোধিত টাকার চেয়ে কম করা যাবে না (ইতিমধ্যে পরিশোধ: ৳${formatTaka(totalPaidPaisa)})`
        );
      }
      updateData.principal = newPrincipalPaisa;
      updateData.status = newPrincipalPaisa === totalPaidPaisa ? 'settled' : 'active';
    }

    const disbursementType = existing.direction === 'borrowed' ? 'loan_in' : 'loan_out';

    await db.transaction(async (tx) => {
      await tx
        .update(loans)
        .set(updateData)
        .where(and(eq(loans.id, loanId), eq(loans.userId, userId)));

      // Keep the original disbursement transaction (if any) consistent with the loan
      const disbursementChanges: Partial<typeof transactions.$inferInsert> = {};
      if (updateData.principal !== undefined) disbursementChanges.amount = updateData.principal;
      if (updateData.startedOn !== undefined) disbursementChanges.occurredOn = updateData.startedOn;
      if (Object.keys(disbursementChanges).length > 0) {
        await tx
          .update(transactions)
          .set({ ...disbursementChanges, updatedAt: new Date() })
          .where(
            and(
              eq(transactions.loanId, loanId),
              eq(transactions.userId, userId),
              eq(transactions.type, disbursementType)
            )
          );
      }
    });

    return (await this.getLoanById(userId, loanId))!;
  }

  /**
   * Create repayment transaction.
   * - Borrowed (দেনা): I pay back -> 'loan_out'
   * - Lent (পাওনা): I collect back -> 'loan_in'
   * The loan row is locked and the remaining balance re-computed inside the DB
   * transaction, so concurrent payments can never overpay the loan.
   */
  async createPayment(userId: string, loanId: string, input: CreateLoanPaymentInput): Promise<Loan> {
    const paymentPaisa = takaToPaisa(input.amount);

    const [wallet] = await db
      .select({ id: wallets.id })
      .from(wallets)
      .where(and(eq(wallets.id, input.walletId), eq(wallets.userId, userId), eq(wallets.archived, false)))
      .limit(1);

    if (!wallet) throw new AppError('নির্বাচিত ওয়ালেটটি পাওয়া যায়নি বা নিষ্ক্রিয়');

    await db.transaction(async (tx) => {
      const [loan] = await tx
        .select()
        .from(loans)
        .where(and(eq(loans.id, loanId), eq(loans.userId, userId)))
        .for('update')
        .limit(1);

      if (!loan) throw notFound();

      const repaymentType = loan.direction === 'borrowed' ? 'loan_out' : 'loan_in';
      const [paid] = await tx
        .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
        .from(transactions)
        .where(and(eq(transactions.loanId, loanId), eq(transactions.type, repaymentType)))
        ;
      const remainingPaisa = loan.principal - BigInt(paid?.total ?? '0');

      if (remainingPaisa <= 0n) {
        throw new AppError('এই ধারটি ইতিমধ্যে সম্পূর্ণ পরিশোধিত হয়ে গেছে');
      }
      if (paymentPaisa > remainingPaisa) {
        throw new AppError(
          `পরিশোধের পরিমাণ বাকি টাকার চেয়ে বেশি হতে পারবে না (সর্বোচ্চ বাকি: ৳${formatTaka(remainingPaisa)})`
        );
      }

      await tx.insert(transactions).values({
        userId,
        type: repaymentType,
        amount: paymentPaisa,
        walletId: input.walletId,
        occurredOn: input.occurredOn,
        note: input.note?.trim() || null,
        loanId,
      });

      if (remainingPaisa - paymentPaisa <= 0n) {
        await tx.update(loans).set({ status: 'settled', updatedAt: new Date() }).where(eq(loans.id, loanId));
      }
    });

    return (await this.getLoanById(userId, loanId))!;
  }

  /**
   * Delete loan and its cascading transactions.
   */
  async deleteLoan(userId: string, loanId: string): Promise<boolean> {
    const [existing] = await db
      .select({ id: loans.id })
      .from(loans)
      .where(and(eq(loans.id, loanId), eq(loans.userId, userId)))
      .limit(1);

    if (!existing) return false;

    // Delete loan (transactions are deleted via ON DELETE CASCADE foreign key)
    const [deleted] = await db
      .delete(loans)
      .where(and(eq(loans.id, loanId), eq(loans.userId, userId)))
      .returning({ id: loans.id });

    return !!deleted;
  }
}

export const loansService = new LoansService();
