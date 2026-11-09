import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDefaultNameLocalizer } from '@/lib/default-names';
import {
  getBudgets,
  getBudgetSummary,
  setBudget,
  deleteBudget,
} from './api';
import type { SetBudgetInput } from '@hisab/shared';

export const BUDGETS_QUERY_KEY = ['budgets'] as const;

export function useBudgets(month: string) {
  const localize = useDefaultNameLocalizer();
  return useQuery({
    select: localize,
    queryKey: [...BUDGETS_QUERY_KEY, month],
    queryFn: () => getBudgets(month),
    enabled: !!month,
  });
}

export function useBudgetSummary(month: string) {
  const localize = useDefaultNameLocalizer();
  return useQuery({
    select: localize,
    queryKey: [...BUDGETS_QUERY_KEY, 'summary', month],
    queryFn: () => getBudgetSummary(month),
    enabled: !!month,
  });
}

export function useSetBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: SetBudgetInput;
    }) => setBudget(categoryId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      month,
    }: {
      categoryId: string;
      month: string;
    }) => deleteBudget(categoryId, month),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
