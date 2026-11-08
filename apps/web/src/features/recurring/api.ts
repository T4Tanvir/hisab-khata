import { api } from '@/lib/api-client';
import type {
  RecurringRule,
  CreateRecurringInput,
  PayRecurringInput,
} from '@hisab/shared';

export async function getRecurringRules(): Promise<RecurringRule[]> {
  const res = await api.get<{ data: RecurringRule[] }>('/recurring');
  return res.data;
}

export async function createRecurringRule(
  data: CreateRecurringInput
): Promise<RecurringRule> {
  const res = await api.post<{ data: RecurringRule }>('/recurring', data);
  return res.data;
}

export async function updateRecurringRule(
  id: string,
  data: Partial<CreateRecurringInput> & { active?: boolean }
): Promise<RecurringRule> {
  const res = await api.patch<{ data: RecurringRule }>(`/recurring/${id}`, data);
  return res.data;
}

export async function deleteRecurringRule(id: string): Promise<void> {
  await api.delete(`/recurring/${id}`);
}

export async function payRecurringRule(
  id: string,
  data: PayRecurringInput = {}
): Promise<{ transaction: any; rule: RecurringRule }> {
  const res = await api.post<{ data: { transaction: any; rule: RecurringRule } }>(
    `/recurring/${id}/pay`,
    data
  );
  return res.data;
}
