import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { ReportPeriod } from '@hisab/shared';
import { useDefaultNameLocalizer } from '@/lib/default-names';
import { getDashboardSummary, getFinancialInsights, getReportOverview } from './api';

export const REPORTS_QUERY_KEY = ['reports'] as const;

export function useDashboardSummary(month: string) {
  const localize = useDefaultNameLocalizer();
  return useQuery({
    select: localize,
    queryKey: [...REPORTS_QUERY_KEY, 'summary', month],
    queryFn: () => getDashboardSummary(month),
    enabled: !!month,
  });
}

export function useFinancialInsights(month: string) {
  const localize = useDefaultNameLocalizer();
  return useQuery({
    select: localize,
    queryKey: [...REPORTS_QUERY_KEY, 'insights', month],
    queryFn: () => getFinancialInsights(month),
    enabled: !!month,
  });
}

export function useReportOverview(period: ReportPeriod, end: string) {
  const localize = useDefaultNameLocalizer();
  return useQuery({
    select: localize,
    queryKey: [...REPORTS_QUERY_KEY, 'overview', period, end],
    queryFn: () => getReportOverview(period, end),
    enabled: !!end,
    // Keep the previous period on screen while the next one loads (no flash on switching)
    placeholderData: keepPreviousData,
  });
}
