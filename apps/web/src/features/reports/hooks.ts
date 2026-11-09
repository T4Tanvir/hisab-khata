import { useQuery } from '@tanstack/react-query';
import { useDefaultNameLocalizer } from '@/lib/default-names';
import {
  getDashboardSummary,
  getTrend,
  getCategoryBreakdown,
  getFinancialInsights,
} from './api';

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

export function useTrend(months = 6) {
  const localize = useDefaultNameLocalizer();
  return useQuery({
    select: localize,
    queryKey: [...REPORTS_QUERY_KEY, 'trend', months],
    queryFn: () => getTrend(months),
  });
}

export function useCategoryBreakdown(month: string) {
  const localize = useDefaultNameLocalizer();
  return useQuery({
    select: localize,
    queryKey: [...REPORTS_QUERY_KEY, 'categories', month],
    queryFn: () => getCategoryBreakdown(month),
    enabled: !!month,
  });
}
