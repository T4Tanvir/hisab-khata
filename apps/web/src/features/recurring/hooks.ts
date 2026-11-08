import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  deleteRecurringRule,
  payRecurringRule,
} from './api';
import type { CreateRecurringInput, PayRecurringInput } from '@hisab/shared';
import { WALLETS_QUERY_KEY } from '../wallets/hooks';
import { TRANSACTIONS_QUERY_KEY } from '../transactions/hooks';

export const RECURRING_QUERY_KEY = ['recurring'] as const;

export function useRecurringRules() {
  return useQuery({
    queryKey: RECURRING_QUERY_KEY,
    queryFn: getRecurringRules,
  });
}

export function useCreateRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringInput) => createRecurringRule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateRecurringInput> & { active?: boolean };
    }) => updateRecurringRule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecurringRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function usePayRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: PayRecurringInput }) =>
      payRecurringRule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
      qc.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
