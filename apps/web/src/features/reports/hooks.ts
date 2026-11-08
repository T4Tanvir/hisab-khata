import { useQuery } from '@tanstack/react-query';
import {
  getDashboardSummary,
  getTrend,
  getCategoryBreakdown,
} from './api';

export const REPORTS_QUERY_KEY = ['reports'] as const;

export function useDashboardSummary(month: string) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'summary', month],
    queryFn: () => getDashboardSummary(month),
    enabled: !!month,
  });
}

export function useTrend(months = 6) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'trend', months],
    queryFn: () => getTrend(months),
  });
}

export function useCategoryBreakdown(month: string) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'categories', month],
    queryFn: () => getCategoryBreakdown(month),
    enabled: !!month,
  });
}
