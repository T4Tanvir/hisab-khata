import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeGoal,
} from './api';
import type { CreateGoalInput, UpdateGoalInput, ContributeGoalInput } from '@hisab/shared';
import { WALLETS_QUERY_KEY } from '../wallets/hooks';
import { TRANSACTIONS_QUERY_KEY } from '../transactions/hooks';

export const GOALS_QUERY_KEY = ['goals'] as const;

export function useGoals() {
  return useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: getGoals,
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: [...GOALS_QUERY_KEY, id],
    queryFn: () => getGoal(id),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalInput) => createGoal(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalInput }) =>
      updateGoal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });
}

export function useContributeGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContributeGoalInput }) =>
      contributeGoal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
