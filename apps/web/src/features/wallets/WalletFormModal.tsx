import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWalletSchema, type CreateWalletInput, WALLET_TYPES } from '@hisab/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCreateWallet } from './hooks';

interface WalletFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WALLET_TYPE_OPTIONS: Array<{ value: (typeof WALLET_TYPES)[number]; label: string }> = [
  { value: 'cash', label: 'নগদ টাকা (Cash)' },
  { value: 'bank', label: 'ব্যাংক হিসাব (Savings / Current)' },
  { value: 'mobile', label: 'মোবাইল ব্যাংকিং (বিকাশ, নগদ, রকেট)' },
  { value: 'card', label: 'ক্রেডিট / ডেবিট কার্ড' },
];

export const WalletFormModal: React.FC<WalletFormModalProps> = ({ isOpen, onClose }) => {
  const createWalletMutation = useCreateWallet();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWalletInput>({
    resolver: zodResolver(createWalletSchema),
    defaultValues: {
      name: '',
      type: 'cash',
      openingBalance: 0,
    },
  });

  const onSubmit = async (data: CreateWalletInput) => {
    try {
      await createWalletMutation.mutateAsync(data);
      reset();
      onClose();
    } catch (err: any) {
      alert(err.message || 'ওয়ালেট তৈরি করতে সমস্যা হয়েছে');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="নতুন অ্যাকাউন্ট / ওয়ালেট যোগ করুন">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="ওয়ালেটের নাম"
          placeholder="যেমন: নগদ, ব্যাংক এশিয়া, বিকাশ পার্সোনাল"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="space-y-1.5">
          <Label htmlFor="wallet-type">অ্যাকাউন্টের ধরন</Label>
          <select
            id="wallet-type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors"
            {...register('type')}
          >
            {WALLET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="text-xs font-medium text-destructive mt-1.5">{errors.type.message}</p>
          )}
        </div>

        <Input
          label="বর্তমান বা প্রারম্ভিক ব্যালেন্স (টাকায়)"
          type="number"
          step="any"
          placeholder="০"
          error={errors.openingBalance?.message}
          {...register('openingBalance')}
        />

        <div className="flex justify-end gap-2.5 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>
            বাতিল
          </Button>
          <Button type="submit" variant="default" isLoading={isSubmitting || createWalletMutation.isPending}>
            সংরক্ষণ করুন
          </Button>
        </div>
      </form>
    </Modal>
  );
};
