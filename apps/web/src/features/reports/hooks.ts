import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from './api';

export const REPORTS_QUERY_KEY = ['reports'] as const;

export function useDashboardSummary(month: string) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'summary', month],
    queryFn: () => getDashboardSummary(month),
    enabled: !!month,
  });
}
