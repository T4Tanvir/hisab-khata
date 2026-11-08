import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contributeGoalSchema, type ContributeGoalInput, type Goal } from '@hisab/shared';
import { useContributeGoal } from './hooks';
import { useWallets } from '../wallets/hooks';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Money } from '@/components/Money';
import { AlertCircle, Target } from 'lucide-react';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const { data: wallets = [] } = useWallets();
  const contributeMutation = useContributeGoal();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContributeGoalInput>({
    resolver: zodResolver(contributeGoalSchema),
    defaultValues: {
      amount: '' as any,
      walletId: wallets[0]?.id || '',
    },
  });

  const currentAmount = watch('amount') || 0;

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      reset({
        amount: '' as any,
        walletId: wallets[0]?.id || '',
      });
    }
  }, [isOpen, wallets, reset]);

  if (!goal) return null;

  const target = BigInt(goal.targetAmount);
  const current = BigInt(goal.currentAmount);
  const remaining = target > current ? target - current : 0n;

  const onSubmit = async (data: ContributeGoalInput) => {
    setErrorMsg(null);
    try {
      await contributeMutation.mutateAsync({
        id: goal.id,
        data: {
          amount: data.amount,
          walletId: data.walletId,
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'টাকা জমা করা যায়নি');
    }
  };

  const handleAddPreset = (addAmount: number) => {
    setValue('amount', (Number(currentAmount) || 0) + addAmount, { shouldValidate: true });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="লক্ষ্যে টাকা জমা দিন"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* লক্ষ্যের সারসংক্ষেপ */}
        <div className="p-3.5 rounded-xl bg-muted/40 border space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Target className="h-4 w-4 text-primary" />
              {goal.name}
            </span>
            <span className="text-xs text-muted-foreground">
              বাকি আছে: <Money amount={remaining.toString()} className="font-semibold text-foreground font-mono" />
            </span>
          </div>
        </div>

        {/* জমা করার পরিমাণ */}
        <div className="space-y-1.5">
          <Label htmlFor="contrib-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            জমার পরিমাণ (৳)
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground select-none">
              ৳
            </span>
            <Input
              id="contrib-amount"
              type="number"
              step="any"
              autoFocus
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              className="pl-9 text-xl sm:text-2xl font-bold font-mono h-12 text-pos focus-visible:ring-pos"
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>

        {/* কুইক প্রিসেট বাটন */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleAddPreset(500)}
            className="text-xs px-2.5 py-1 rounded-lg border bg-card hover:bg-accent text-foreground transition-colors font-medium"
          >
            +৳৫০০
          </button>
          <button
            type="button"
            onClick={() => handleAddPreset(1000)}
            className="text-xs px-2.5 py-1 rounded-lg border bg-card hover:bg-accent text-foreground transition-colors font-medium"
          >
            +৳১,০০০
          </button>
          <button
            type="button"
            onClick={() => handleAddPreset(5000)}
            className="text-xs px-2.5 py-1 rounded-lg border bg-card hover:bg-accent text-foreground transition-colors font-medium"
          >
            +৳৫,০০০
          </button>
        </div>

        {/* ওয়ালেট সিলেকশন */}
        <div className="space-y-1.5">
          <Label htmlFor="contrib-wallet" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            যে ওয়ালেট থেকে কাটা হবে
          </Label>
          <select
            id="contrib-wallet"
            {...register('walletId')}
            className="w-full h-10 rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.walletId && (
            <p className="text-xs text-destructive">{errors.walletId.message}</p>
          )}
        </div>

        {/* অ্যাকশন বাটনসমূহ */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            বাতিল
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || contributeMutation.isPending}
            className="min-w-[120px] bg-pos hover:bg-pos/90 text-white"
          >
            {isSubmitting || contributeMutation.isPending ? 'জমা হচ্ছে...' : 'জমা সম্পন্ন করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
