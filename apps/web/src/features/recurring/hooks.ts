import { useCallback, useState } from 'react';
import { useDefaultNameLocalizer } from '@/lib/default-names';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  deleteRecurringRule,
  payRecurringRule,
} from './api';
import type { CreateRecurringInput, PayRecurringInput, RecurringRule } from '@hisab/shared';
import { WALLETS_QUERY_KEY } from '../wallets/hooks';
import { TRANSACTIONS_QUERY_KEY } from '../transactions/hooks';

export const RECURRING_QUERY_KEY = ['recurring'] as const;

export function useRecurringRules() {
  const localize = useDefaultNameLocalizer();
  return useQuery({
    select: localize,
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

/**
 * Pays a recurring rule while tracking WHICH rule is being paid (so only that
 * bill shows "processing") and keeping any failure (e.g. 409 already paid /
 * inactive) as a message instead of an unhandled rejection.
 */
export function useRecurringPayAction() {
  const payMutation = usePayRecurringRule();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<{ ruleId: string; message: string } | null>(null);

  const pay = async (rule: RecurringRule, fallbackMessage: string) => {
    setPayError(null);
    setPayingId(rule.id);
    try {
      await payMutation.mutateAsync({ id: rule.id });
    } catch (err: any) {
      setPayError({ ruleId: rule.id, message: err?.message || fallbackMessage });
    } finally {
      setPayingId(null);
    }
  };

  const clearPayError = useCallback(() => setPayError(null), []);

  return { pay, payingId, payError, clearPayError };
}
