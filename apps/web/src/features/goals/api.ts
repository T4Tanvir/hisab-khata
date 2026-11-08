import { api } from '@/lib/api-client';
import type {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  ContributeGoalInput,
} from '@hisab/shared';

export async function getGoals(): Promise<Goal[]> {
  const res = await api.get<{ data: Goal[] }>('/goals');
  return res.data;
}

export async function getGoal(id: string): Promise<Goal> {
  const res = await api.get<{ data: Goal }>(`/goals/${id}`);
  return res.data;
}

export async function createGoal(data: CreateGoalInput): Promise<Goal> {
  const res = await api.post<{ data: Goal }>('/goals', data);
  return res.data;
}

export async function updateGoal(id: string, data: UpdateGoalInput): Promise<Goal> {
  const res = await api.patch<{ data: Goal }>(`/goals/${id}`, data);
  return res.data;
}

export async function deleteGoal(id: string): Promise<void> {
  await api.delete(`/goals/${id}`);
}

export async function contributeGoal(
  id: string,
  data: ContributeGoalInput
): Promise<{ goal: Goal; transactionId: string }> {
  const res = await api.post<{ data: { goal: Goal; transactionId: string } }>(
    `/goals/${id}/contribute`,
    data
  );
  return res.data;
}
