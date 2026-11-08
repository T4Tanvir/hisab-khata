import { api } from '@/lib/api-client';
import type { Budget, SetBudgetInput } from '@hisab/shared';

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

export async function getBudgets(month: string): Promise<Budget[]> {
  const res = await api.get<{ data: Budget[] }>(
    `/budgets?month=${encodeURIComponent(month)}`
  );
  return res.data;
}

export async function getBudgetSummary(month: string): Promise<BudgetSummary> {
  const res = await api.get<{ data: BudgetSummary }>(
    `/budgets/summary?month=${encodeURIComponent(month)}`
  );
  return res.data;
}

export async function setBudget(
  categoryId: string,
  input: SetBudgetInput
): Promise<Budget> {
  const res = await api.put<{ data: Budget }>(`/budgets/${categoryId}`, input);
  return res.data;
}

export async function deleteBudget(
  categoryId: string,
  month: string
): Promise<void> {
  await api.delete(`/budgets/${categoryId}?month=${encodeURIComponent(month)}`);
}
