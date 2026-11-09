import { api } from '@/lib/api-client';
import type { DashboardSummary, FinancialInsight, ReportOverview, ReportPeriod } from '@hisab/shared';

export async function getDashboardSummary(month: string): Promise<DashboardSummary> {
  const res = await api.get<{ data: DashboardSummary }>(
    `/reports/summary?month=${encodeURIComponent(month)}`
  );
  return res.data;
}

export async function getFinancialInsights(month: string): Promise<FinancialInsight[]> {
  const res = await api.get<{ data: FinancialInsight[] }>(
    `/reports/insights?month=${encodeURIComponent(month)}`
  );
  return res.data;
}

/** Full report for a period: `period` months ending at `end` (YYYY-MM), or year-to-date. */
export async function getReportOverview(period: ReportPeriod, end: string): Promise<ReportOverview> {
  const params = new URLSearchParams({ period, end });
  const res = await api.get<{ data: ReportOverview }>(`/reports/overview?${params}`);
  return res.data;
}

/** Downloads a CSV of every transaction from `from` to `to` (inclusive YYYY-MM months). */
export function downloadExportCsv(range?: { from: string; to: string }) {
  const query = range ? `?${new URLSearchParams(range)}` : '';
  window.open(`/api/reports/export${query}`, '_blank');
}
