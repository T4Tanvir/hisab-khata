import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWallets, createWallet, updateWallet, deleteWallet } from './api';
import type { CreateWalletInput, UpdateWalletInput } from '@hisab/shared';

export const WALLETS_QUERY_KEY = ['wallets'] as const;

export function useWallets() {
  return useQuery({
    queryKey: WALLETS_QUERY_KEY,
    queryFn: getWallets,
  });
}

export function useCreateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWalletInput) => createWallet(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWalletInput }) =>
      updateWallet(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWallet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
