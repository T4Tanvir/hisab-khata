import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createRecurringSchema,
  getDhakaDate,
  paisaToTaka,
  type CreateRecurringInput,
  type RecurringRule,
} from '@hisab/shared';
import { useCreateRecurringRule, useUpdateRecurringRule } from './hooks';
import { useWallets } from '../wallets/hooks';
import { useCategories } from '../categories/hooks';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface RecurringFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToEdit?: RecurringRule | null;
}

export const RecurringFormModal: React.FC<RecurringFormModalProps> = ({
  isOpen,
  onClose,
  ruleToEdit,
}) => {
  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateRecurringRule();
  const updateMutation = useUpdateRecurringRule();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEditing = Boolean(ruleToEdit);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRecurringInput>({
    resolver: zodResolver(createRecurringSchema),
    defaultValues: {
      type: 'expense',
      amount: '' as any,
      walletId: '',
      categoryId: '',
      frequency: 'monthly',
      dayOfMonth: 1,
      nextDueOn: getDhakaDate(),
      note: '',
    },
  });

  const selectedType = watch('type');
  const availableCategories = categories.filter((c) => c.type === selectedType);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (ruleToEdit) {
        reset({
          type: ruleToEdit.type,
          amount: paisaToTaka(ruleToEdit.amount),
          walletId: ruleToEdit.walletId,
          categoryId: ruleToEdit.categoryId,
          frequency: ruleToEdit.frequency,
          dayOfMonth: ruleToEdit.dayOfMonth,
          nextDueOn: ruleToEdit.nextDueOn,
          note: ruleToEdit.note || '',
        });
      } else {
        const defaultWallet = wallets[0]?.id || '';
        const defaultCat = categories.find((c) => c.type === 'expense')?.id || '';
        reset({
          type: 'expense',
          amount: '' as any,
          walletId: defaultWallet,
          categoryId: defaultCat,
          frequency: 'monthly',
          dayOfMonth: new Date().getDate(),
          nextDueOn: getDhakaDate(),
          note: '',
        });
      }
    }
  }, [isOpen, ruleToEdit, wallets, categories, reset]);

  const onSubmit = async (data: CreateRecurringInput) => {
    setErrorMsg(null);
    try {
      if (isEditing && ruleToEdit) {
        await updateMutation.mutateAsync({
          id: ruleToEdit.id,
          data: {
            type: data.type,
            amount: data.amount,
            walletId: data.walletId,
            categoryId: data.categoryId,
            frequency: data.frequency,
            dayOfMonth: data.dayOfMonth,
            nextDueOn: data.nextDueOn,
            note: data.note,
          },
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'নিয়ম সংরক্ষণ করা যায়নি');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'নিয়মিত লেনদেন পরিবর্তন' : 'নতুন নিয়মিত লেনদেন বা বিল'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ধরণ সুইচ (খরচ / আয়) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-xl border">
          <button
            type="button"
            onClick={() => {
              setValue('type', 'expense');
              const cat = categories.find((c) => c.type === 'expense');
              setValue('categoryId', cat?.id || '');
            }}
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              selectedType === 'expense'
                ? 'bg-card text-neg shadow-sm'
                : 'text-muted-foreground hover:text-neg'
            }`}
          >
            নিয়মিত খরচ (বিল/ভাড়া)
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('type', 'income');
              const cat = categories.find((c) => c.type === 'income');
              setValue('categoryId', cat?.id || '');
            }}
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              selectedType === 'income'
                ? 'bg-card text-pos shadow-sm'
                : 'text-muted-foreground hover:text-pos'
            }`}
          >
            নিয়মিত আয় (বেতন/ভাতা)
          </button>
        </div>

        {/* টাকার পরিমাণ */}
        <div className="space-y-1.5">
          <Label htmlFor="rec-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            টাকার পরিমাণ (৳)
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground select-none">
              ৳
            </span>
            <Input
              id="rec-amount"
              type="number"
              step="any"
              autoFocus
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              className={`pl-9 text-xl sm:text-2xl font-bold font-mono h-12 ${
                selectedType === 'income' ? 'text-pos focus-visible:ring-pos' : 'text-neg focus-visible:ring-neg'
              }`}
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>

        {/* ক্যাটাগরি ও ওয়ালেট */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rec-cat" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              খাত / ক্যাটাগরি
            </Label>
            <select
              id="rec-cat"
              {...register('categoryId')}
              className="w-full h-10 rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rec-wallet" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ওয়ালেট / অ্যাকাউন্ট
            </Label>
            <select
              id="rec-wallet"
              {...register('walletId')}
              className="w-full h-10 rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ফ্রিকোয়েন্সি ও তারিখ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              সময়কাল
            </Label>
            <select
              {...register('frequency')}
              className="w-full h-10 rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="monthly">প্রতি মাসে</option>
              <option value="weekly">সাপ্তাহিক</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              মাসের কত তারিখে
            </Label>
            <Input
              type="number"
              min={1}
              max={31}
              {...register('dayOfMonth', { valueAsNumber: true })}
              className="h-10 text-sm bg-card"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              পরবর্তী পরিশোধের তারিখ
            </Label>
            <Input
              type="date"
              {...register('nextDueOn')}
              className="h-10 text-sm bg-card"
            />
          </div>
        </div>

        {/* নোট বা বিবরণ */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            নোট বা বিবরণ (ঐচ্ছিক)
          </Label>
          <Input
            placeholder="যেমন: বাসা ভাড়া, ওয়াইফাই বিল, অফিস বেতন..."
            {...register('note')}
            className="h-10 text-sm bg-card"
          />
        </div>

        {/* অ্যাকশন বাটনসমূহ */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            বাতিল
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="min-w-[120px]"
          >
            {isSubmitting || createMutation.isPending || updateMutation.isPending
              ? 'সংরক্ষণ হচ্ছে...'
              : isEditing
              ? 'পরিবর্তন সংরক্ষণ'
              : 'তৈরি করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
