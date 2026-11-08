import { and, eq, or, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { wallets, transactions } from '../../db/schema';
import { takaToPaisa, type CreateWalletInput, type UpdateWalletInput } from '@hisab/shared';

export class WalletsService {
  /**
   * Retrieves all active wallets for a user along with dynamically computed current balance.
   * Formula: opening_balance + income - expense - transfer_out + transfer_in
   */
  async getUserWallets(userId: string, { includeArchived = false } = {}) {
    const walletScope = includeArchived
      ? eq(wallets.userId, userId)
      : and(eq(wallets.userId, userId), eq(wallets.archived, false));

    // Subquery or aggregation for transactions delta
    const userWallets = await db
      .select({
        id: wallets.id,
        userId: wallets.userId,
        name: wallets.name,
        type: wallets.type,
        openingBalance: wallets.openingBalance,
        archived: wallets.archived,
        createdAt: wallets.createdAt,
        updatedAt: wallets.updatedAt,
      })
      .from(wallets)
      .where(walletScope)
      .orderBy(wallets.createdAt);

    if (userWallets.length === 0) {
      return [];
    }

    // Get all transactions involving this user's wallets to compute balances
    const deltas = await db
      .select({
        walletId: wallets.id,
        delta: sql<string>`COALESCE(SUM(
          CASE
            WHEN ${transactions.type} = 'income' AND ${transactions.walletId} = ${wallets.id} THEN ${transactions.amount}
            WHEN ${transactions.type} = 'expense' AND ${transactions.walletId} = ${wallets.id} THEN -${transactions.amount}
            WHEN ${transactions.type} = 'transfer' AND ${transactions.walletId} = ${wallets.id} THEN -${transactions.amount}
            WHEN ${transactions.type} = 'transfer' AND ${transactions.toWalletId} = ${wallets.id} THEN ${transactions.amount}
            ELSE 0
          END
        ), 0)`,
      })
      .from(wallets)
      .leftJoin(
        transactions,
        or(
          eq(transactions.walletId, wallets.id),
          eq(transactions.toWalletId, wallets.id)
        )
      )
      .where(walletScope)
      .groupBy(wallets.id);

    const deltaMap = new Map<string, bigint>();
    for (const d of deltas) {
      deltaMap.set(d.walletId, BigInt(d.delta || '0'));
    }

    return userWallets.map((w) => {
      const delta = deltaMap.get(w.id) ?? 0n;
      const currentBalance = BigInt(w.openingBalance) + delta;
      return {
        ...w,
        openingBalance: w.openingBalance.toString(),
        currentBalance: currentBalance.toString(),
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      };
    });
  }

  async getWalletById(userId: string, walletId: string) {
    // Include archived so that archiving a wallet via PATCH still returns it
    const list = await this.getUserWallets(userId, { includeArchived: true });
    return list.find((w) => w.id === walletId) ?? null;
  }

  async createWallet(userId: string, input: CreateWalletInput) {
    const openingBalancePaisa = takaToPaisa(input.openingBalance ?? 0);

    const [created] = await db
      .insert(wallets)
      .values({
        userId,
        name: input.name,
        type: input.type,
        openingBalance: openingBalancePaisa,
      })
      .returning();

    return {
      ...created,
      openingBalance: created.openingBalance.toString(),
      currentBalance: created.openingBalance.toString(),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateWallet(userId: string, walletId: string, input: UpdateWalletInput) {
    const existing = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    const updateData: Partial<typeof wallets.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.openingBalance !== undefined) {
      updateData.openingBalance = takaToPaisa(input.openingBalance);
    }
    if (input.archived !== undefined) updateData.archived = input.archived;

    const [updated] = await db
      .update(wallets)
      .set(updateData)
      .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
      .returning();

    return this.getWalletById(userId, updated.id);
  }

  async deleteWallet(userId: string, walletId: string) {
    const existing = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    // Check if any transactions reference this wallet
    const txCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(or(eq(transactions.walletId, walletId), eq(transactions.toWalletId, walletId)));

    const count = txCount[0]?.count ?? 0;

    if (count > 0) {
      // Archive rather than delete to preserve transaction ledger
      await db
        .update(wallets)
        .set({ archived: true, updatedAt: new Date() })
        .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)));
      return { success: true, archived: true };
    }

    // Safe to delete completely
    await db
      .delete(wallets)
      .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)));

    return { success: true, archived: false };
  }
}

export const walletsService = new WalletsService();
