import { api } from '@/lib/api-client';
import type {
  Loan,
  LoanSummary,
  CreateLoanInput,
  UpdateLoanInput,
  CreateLoanPaymentInput,
  LoanFilterInput,
} from '@hisab/shared';

export async function getLoans(filters: LoanFilterInput = {}): Promise<Loan[]> {
  const params = new URLSearchParams();
  if (filters.direction) params.append('direction', filters.direction);
  if (filters.status) params.append('status', filters.status);
  if (filters.q) params.append('q', filters.q);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await api.get<{ data: Loan[] }>(`/loans${queryStr}`);
  return res.data;
}

export async function getLoanSummary(): Promise<LoanSummary> {
  const res = await api.get<{ data: LoanSummary }>('/loans/summary');
  return res.data;
}

export async function getLoanById(id: string): Promise<Loan> {
  const res = await api.get<{ data: Loan }>(`/loans/${id}`);
  return res.data;
}

export async function createLoan(data: CreateLoanInput): Promise<Loan> {
  const res = await api.post<{ data: Loan }>('/loans', data);
  return res.data;
}

export async function updateLoan(id: string, data: UpdateLoanInput): Promise<Loan> {
  const res = await api.patch<{ data: Loan }>(`/loans/${id}`, data);
  return res.data;
}

export async function createLoanPayment(
  id: string,
  data: CreateLoanPaymentInput
): Promise<Loan> {
  const res = await api.post<{ data: Loan }>(`/loans/${id}/payments`, data);
  return res.data;
}

export async function deleteLoan(id: string): Promise<void> {
  await api.delete(`/loans/${id}`);
}
