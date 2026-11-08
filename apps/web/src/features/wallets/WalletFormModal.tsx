import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWalletSchema, type CreateWalletInput, WALLET_TYPES } from '@hisab/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateWallet } from './hooks';

interface WalletFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WALLET_TYPE_OPTIONS: Array<{ value: (typeof WALLET_TYPES)[number]; label: string }> = [
  { value: 'cash', label: 'নগদ টাকা' },
  { value: 'bank', label: 'সঞ্চয়ী / চলতি ব্যাংক হিসাব' },
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
      <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ border: 'none', padding: 0 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Input
            label="ওয়ালেটের নাম"
            placeholder="যেমন: নগদ, ব্যাংক এশিয়া, বিকাশ পার্সোনাল"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem' }}>
            অ্যাকাউন্টের ধরন
          </label>
          <select
            className="input"
            style={{ width: '100%' }}
            {...register('type')}
          >
            {WALLET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.type && <span className="form-error text-neg">{errors.type.message}</span>}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <Input
            label="বর্তমান বা প্রারম্ভিক ব্যালেন্স (টাকায়)"
            type="number"
            step="any"
            placeholder="০"
            error={errors.openingBalance?.message}
            {...register('openingBalance')}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            বাতিল
          </Button>
          <Button type="submit" isLoading={isSubmitting || createWalletMutation.isPending}>
            সংরক্ষণ করুন
          </Button>
        </div>
      </form>
    </Modal>
  );
};
