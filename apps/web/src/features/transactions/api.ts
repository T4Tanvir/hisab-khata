import { api } from '@/lib/api-client';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilterInput,
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

/** Create and update both return the saved transaction plus an optional budget warning. */
export interface SaveTransactionResponse {
  data: Transaction;
  budgetAlert?: BudgetAlert | null;
}

export interface MonthSummary {
  month: string;
  totalIncome: string;
  totalExpense: string;
  netSavings: string;
  count: number;
}

export async function getTransactions(
  filters: TransactionFilterInput = {}
): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (filters.month) params.append('month', filters.month);
  if (filters.type) params.append('type', filters.type);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.walletId) params.append('walletId', filters.walletId);
  if (filters.q) params.append('q', filters.q);
  if (filters.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await api.get<{ data: Transaction[] }>(`/transactions${queryString}`);
  return res.data;
}

export async function getMonthSummary(month: string): Promise<MonthSummary> {
  const res = await api.get<{ data: MonthSummary }>(
    `/transactions/summary?month=${encodeURIComponent(month)}`
  );
  return res.data;
}

export async function getTransaction(id: string): Promise<Transaction> {
  const res = await api.get<{ data: Transaction }>(`/transactions/${id}`);
  return res.data;
}

export async function createTransaction(
  data: CreateTransactionInput
): Promise<SaveTransactionResponse> {
  return api.post<SaveTransactionResponse>('/transactions', data);
}

export async function updateTransaction(
  id: string,
  data: UpdateTransactionInput
): Promise<SaveTransactionResponse> {
  return api.patch<SaveTransactionResponse>(`/transactions/${id}`, data);
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/transactions/${id}`);
}
