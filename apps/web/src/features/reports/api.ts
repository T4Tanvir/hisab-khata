import { api } from '@/lib/api-client';
import type { DashboardSummary } from '@hisab/shared';

export interface TrendItem {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
  savings: number;
}

export interface CategoryComparison {
  categoryId: string;
  categoryName: string;
  color: number;
  shortLabel: string;
  currentAmount: string;
  prevAmount: string;
  diff: string;
  txCount: number;
}

export async function getDashboardSummary(month: string): Promise<DashboardSummary> {
  const res = await api.get<{ data: DashboardSummary }>(
    `/reports/summary?month=${encodeURIComponent(month)}`
  );
  return res.data;
}

export async function getTrend(months = 6): Promise<TrendItem[]> {
  const res = await api.get<{ data: TrendItem[] }>(`/reports/trend?months=${months}`);
  return res.data;
}

export async function getCategoryBreakdown(month: string): Promise<CategoryComparison[]> {
  const res = await api.get<{ data: CategoryComparison[] }>(
    `/reports/categories?month=${encodeURIComponent(month)}`
  );
  return res.data;
}

export function downloadExportCsv(month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  window.open(`/api/reports/export${query}`, '_blank');
}
