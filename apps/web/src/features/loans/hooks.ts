import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLoans,
  getLoanSummary,
  getLoanById,
  createLoan,
  updateLoan,
  createLoanPayment,
  deleteLoan,
} from './api';
import type {
  CreateLoanInput,
  UpdateLoanInput,
  CreateLoanPaymentInput,
  LoanFilterInput,
} from '@hisab/shared';
import { WALLETS_QUERY_KEY } from '../wallets/hooks';
import { TRANSACTIONS_QUERY_KEY } from '../transactions/hooks';

export const LOANS_QUERY_KEY = ['loans'] as const;
export const LOAN_SUMMARY_QUERY_KEY = ['loans', 'summary'] as const;

export function useLoans(filters?: LoanFilterInput) {
  return useQuery({
    queryKey: [...LOANS_QUERY_KEY, filters],
    queryFn: () => getLoans(filters),
  });
}

export function useLoanSummary() {
  return useQuery({
    queryKey: LOAN_SUMMARY_QUERY_KEY,
    queryFn: getLoanSummary,
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: [...LOANS_QUERY_KEY, 'detail', id],
    queryFn: () => getLoanById(id),
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLoanInput) => createLoan(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLoanInput }) =>
      updateLoan(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...LOANS_QUERY_KEY, 'detail', variables.id] });
    },
  });
}

export function useCreateLoanPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateLoanPaymentInput }) =>
      createLoanPayment(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...LOANS_QUERY_KEY, 'detail', variables.id] });
      qc.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLoan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
