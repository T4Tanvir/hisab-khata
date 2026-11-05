import { db } from './client';
import { wallets, categories } from './schema';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@hisab/shared';

export async function seedNewUserData(userId: string) {
  // 1. Create a default "নগদ" cash wallet
  await db.insert(wallets).values({
    userId,
    name: 'নগদ',
    type: 'cash',
    openingBalance: 0n,
  });

  // 2. Create default expense categories
  const expenseValues = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
    userId,
    name: cat.name,
    shortLabel: cat.shortLabel,
    color: cat.color,
    type: 'expense' as const,
  }));

  // 3. Create default income categories
  const incomeValues = DEFAULT_INCOME_CATEGORIES.map((cat) => ({
    userId,
    name: cat.name,
    shortLabel: cat.shortLabel,
    color: cat.color,
    type: 'income' as const,
  }));

  await db.insert(categories).values([...expenseValues, ...incomeValues]);
}

