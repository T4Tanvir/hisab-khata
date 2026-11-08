import { api } from '@/lib/api-client';
import type { DashboardSummary } from '@hisab/shared';

export async function getDashboardSummary(month: string): Promise<DashboardSummary> {
  const res = await api.get<{ data: DashboardSummary }>(
    `/reports/summary?month=${encodeURIComponent(month)}`
  );
  return res.data;
}
