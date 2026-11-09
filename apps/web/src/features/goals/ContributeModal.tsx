import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contributeGoalSchema, type ContributeGoalInput, type Goal, type Wallet } from '@hisab/shared';
import { useContributeGoal } from './hooks';
import { useWallets } from '../wallets/hooks';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Money } from '@/components/Money';
import { useLanguage } from '@/hooks/useLanguage';
import { localizeFieldError } from '@/lib/form-errors';
import { AlertCircle, Target } from 'lucide-react';

// Stable fallback: a fresh `[]` on every render would retrigger effects while queries load
const NO_WALLETS: Wallet[] = [];
const PRESETS_TAKA = [500, 1000, 5000];

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
  const { t, language, formatAmount } = useLanguage();
  const { data: wallets = NO_WALLETS } = useWallets();
  const contributeMutation = useContributeGoal();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContributeGoalInput>({
    resolver: zodResolver(contributeGoalSchema),
    defaultValues: {
      amount: '' as any,
      walletId: '',
    },
  });

  const currentAmount = watch('amount') || 0;

  // Reset only when the modal opens (or the goal changes) — a wallet refetch
  // must never wipe the amount being typed.
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    reset({ amount: '' as any, walletId: '' });
  }, [isOpen, goal?.id, reset]);

  // Default wallet once the list is available, only if none is selected yet
  useEffect(() => {
    if (!isOpen) return;
    if (!getValues('walletId') && wallets[0]) {
      setValue('walletId', wallets[0].id);
    }
  }, [isOpen, wallets, getValues, setValue]);

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
      setErrorMsg(err?.message || t.goals.contributeError);
    }
  };

  const handleAddPreset = (addAmount: number) => {
    setValue('amount', (Number(currentAmount) || 0) + addAmount, { shouldValidate: true });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.goals.contributeTitle}
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
              {t.goals.remainingLabel}: <Money amount={remaining.toString()} className="font-semibold text-foreground font-mono" />
            </span>
          </div>
        </div>

        {/* জমা করার পরিমাণ */}
        <div className="space-y-1.5">
          <Label htmlFor="contrib-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.goals.contribAmount}
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
            <p className="text-xs text-destructive">
              {localizeFieldError(errors.amount, t.form.amountRequired, language)}
            </p>
          )}
        </div>

        {/* কুইক প্রিসেট বাটন */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESETS_TAKA.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleAddPreset(preset)}
              className="text-xs px-2.5 py-1 rounded-lg border bg-card hover:bg-accent text-foreground transition-colors font-medium"
            >
              +{formatAmount(preset * 100)}
            </button>
          ))}
        </div>

        {/* ওয়ালেট সিলেকশন */}
        <div className="space-y-1.5">
          <Label htmlFor="contrib-wallet" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.goals.fromWallet}
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
            <p className="text-xs text-destructive">
              {localizeFieldError(errors.walletId, t.form.walletRequired, language)}
            </p>
          )}
        </div>

        {/* অ্যাকশন বাটনসমূহ */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || contributeMutation.isPending}
            className="min-w-[120px] bg-pos hover:bg-pos/90 text-white"
          >
            {isSubmitting || contributeMutation.isPending ? t.goals.contributing : t.goals.confirmContribute}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
