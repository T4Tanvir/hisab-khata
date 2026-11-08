import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { setBudgetSchema, type SetBudgetInput, type Budget, paisaToTaka } from '@hisab/shared';
import { useSetBudget, useDeleteBudget } from './hooks';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryChip } from '@/components/CategoryChip';
import { AlertCircle, Trash2 } from 'lucide-react';

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
  month: string;
}

export const BudgetFormModal: React.FC<BudgetFormModalProps> = ({
  isOpen,
  onClose,
  budget,
  month,
}) => {
  const setBudgetMutation = useSetBudget();
  const deleteBudgetMutation = useDeleteBudget();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SetBudgetInput>({
    resolver: zodResolver(setBudgetSchema),
    defaultValues: {
      month,
      amount: 0,
    },
  });

  const currentAmount = watch('amount') || 0;

  useEffect(() => {
    if (isOpen && budget) {
      setErrorMsg(null);
      const taka = BigInt(budget.amount || '0') > 0n ? paisaToTaka(budget.amount) : 0;
      reset({
        month,
        amount: taka,
      });
    }
  }, [isOpen, budget, month, reset]);

  if (!budget) return null;

  const onSubmit = async (data: SetBudgetInput) => {
    setErrorMsg(null);
    try {
      await setBudgetMutation.mutateAsync({
        categoryId: budget.categoryId,
        data: {
          month,
          amount: data.amount,
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'বাজেট সীমা সংরক্ষণ করা যায়নি');
    }
  };

  const handleDelete = async () => {
    if (!confirm('আপনি কি এই ক্যাটাগরির বাজেট সীমা মুছে ফেলতে চান?')) return;
    setErrorMsg(null);
    try {
      await deleteBudgetMutation.mutateAsync({
        categoryId: budget.categoryId,
        month,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'বাজেট সীমা মোছা যায়নি');
    }
  };

  const handleAddPreset = (addAmount: number) => {
    setValue('amount', (Number(currentAmount) || 0) + addAmount, { shouldValidate: true });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="বাজেট সীমা নির্ধারণ"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ক্যাটাগরি তথ্য */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border">
          <span
            className="h-3.5 w-3.5 rounded-full shrink-0"
            style={{ backgroundColor: `var(--c${budget.categoryColor || 1})` }}
          />
          <span className="font-bold text-sm sm:text-base text-foreground">
            {budget.categoryName}
          </span>
          {budget.categoryShortLabel && (
            <CategoryChip
              label={budget.categoryShortLabel}
              color={budget.categoryColor || 1}
              size="sm"
            />
          )}
        </div>

        {/* বাজেট পরিমাণ ইনপুট */}
        <div className="space-y-1.5">
          <Label htmlFor="budget-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            মাসিক বাজেট সীমা (৳)
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground select-none">
              ৳
            </span>
            <Input
              id="budget-amount"
              type="number"
              step="any"
              autoFocus
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              className="pl-9 text-xl sm:text-2xl font-bold font-mono h-12 text-foreground focus-visible:ring-primary"
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
          <button
            type="button"
            onClick={() => handleAddPreset(10000)}
            className="text-xs px-2.5 py-1 rounded-lg border bg-card hover:bg-accent text-foreground transition-colors font-medium"
          >
            +৳১০,০০০
          </button>
          <button
            type="button"
            onClick={() => setValue('amount', 0, { shouldValidate: true })}
            className="text-xs px-2.5 py-1 rounded-lg border bg-card hover:bg-accent text-muted-foreground transition-colors font-medium ml-auto"
          >
            ক্লিয়ার (০)
          </button>
        </div>

        {/* অ্যাকশন বাটনসমূহ */}
        <div className="flex items-center justify-between pt-3 border-t">
          {BigInt(budget.amount || '0') > 0n ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteBudgetMutation.isPending || isSubmitting}
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-border/70"
            >
              <Trash2 className="h-4 w-4" />
              বাজেট মুছুন
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              বাতিল
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || setBudgetMutation.isPending}
              className="min-w-[110px]"
            >
              {isSubmitting || setBudgetMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
