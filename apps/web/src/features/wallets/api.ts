import { api } from '@/lib/api-client';
import type { Wallet, CreateWalletInput, UpdateWalletInput } from '@hisab/shared';

export const getWallets = async (): Promise<Wallet[]> => {
  const res = await api.get<{ data: Wallet[] }>('/wallets');
  return res.data;
};

export const createWallet = async (data: CreateWalletInput): Promise<Wallet> => {
  const res = await api.post<{ data: Wallet }>('/wallets', data);
  return res.data;
};

export const updateWallet = async (id: string, data: UpdateWalletInput): Promise<Wallet> => {
  const res = await api.patch<{ data: Wallet }>(`/wallets/${id}`, data);
  return res.data;
};

export const deleteWallet = async (
  id: string
): Promise<{ success: boolean; archived: boolean; message: string }> => {
  const res = await api.delete<{
    data: { success: boolean; archived: boolean; message: string };
  }>(`/wallets/${id}`);
  return res.data;
};
