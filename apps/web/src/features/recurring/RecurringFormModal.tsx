import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createRecurringSchema,
  getDhakaDate,
  paisaToTaka,
  type Category,
  type CreateRecurringInput,
  type RecurringRule,
  type Wallet,
} from '@hisab/shared';
import { useCreateRecurringRule, useUpdateRecurringRule } from './hooks';
import { useWallets } from '../wallets/hooks';
import { useCategories } from '../categories/hooks';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';
import { localizeFieldError } from '@/lib/form-errors';
import { AlertCircle } from 'lucide-react';

interface RecurringFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToEdit?: RecurringRule | null;
}

// Stable fallbacks: a fresh `[]` on every render would retrigger effects while queries load
const NO_WALLETS: Wallet[] = [];
const NO_CATEGORIES: Category[] = [];

/** Today's day-of-month in Asia/Dhaka (not the browser's local/UTC date) */
function getDhakaDayOfMonth(): number {
  return Number(getDhakaDate().slice(8, 10));
}

const selectClass =
  'w-full h-10 rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export const RecurringFormModal: React.FC<RecurringFormModalProps> = ({
  isOpen,
  onClose,
  ruleToEdit,
}) => {
  const { t, language } = useLanguage();
  const { data: wallets = NO_WALLETS } = useWallets();
  const { data: categories = NO_CATEGORIES } = useCategories();
  const createMutation = useCreateRecurringRule();
  const updateMutation = useUpdateRecurringRule();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const isEditing = Boolean(ruleToEdit);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
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
      dayOfMonth: getDhakaDayOfMonth(),
      nextDueOn: getDhakaDate(),
      note: '',
    },
  });

  const selectedType = watch('type');
  const availableCategories = categories.filter((c) => c.type === selectedType);

  // Reset or populate the form only when the modal opens (or the edited rule changes).
  // Wallet/category lists are deliberately NOT dependencies: a background refetch
  // must never wipe what the user is typing.
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setIsActive(ruleToEdit ? ruleToEdit.active !== false : true);
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
      reset({
        type: 'expense',
        amount: '' as any,
        walletId: '',
        categoryId: '',
        frequency: 'monthly',
        dayOfMonth: getDhakaDayOfMonth(),
        nextDueOn: getDhakaDate(),
        note: '',
      });
    }
  }, [isOpen, ruleToEdit, reset]);

  // For a new rule, fill in a default wallet/category once the lists are
  // available — only into fields that are still empty.
  useEffect(() => {
    if (!isOpen || isEditing) return;
    if (!getValues('walletId') && wallets[0]) {
      setValue('walletId', wallets[0].id);
    }
    if (!getValues('categoryId')) {
      const firstCategory = categories.find((c) => c.type === getValues('type'));
      if (firstCategory) setValue('categoryId', firstCategory.id);
    }
  }, [isOpen, isEditing, wallets, categories, getValues, setValue]);

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
            active: isActive,
          },
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || t.recurring.saveError);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t.recurring.editTitle : t.recurring.createTitle}
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
              setValue('categoryId', cat?.id || '', { shouldValidate: Boolean(errors.categoryId) });
            }}
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              selectedType === 'expense'
                ? 'bg-card text-neg shadow-sm'
                : 'text-muted-foreground hover:text-neg'
            }`}
          >
            {t.recurring.expenseTab}
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('type', 'income');
              const cat = categories.find((c) => c.type === 'income');
              setValue('categoryId', cat?.id || '', { shouldValidate: Boolean(errors.categoryId) });
            }}
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              selectedType === 'income'
                ? 'bg-card text-pos shadow-sm'
                : 'text-muted-foreground hover:text-pos'
            }`}
          >
            {t.recurring.incomeTab}
          </button>
        </div>

        {/* টাকার পরিমাণ */}
        <div className="space-y-1.5">
          <Label htmlFor="rec-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.common.amountTaka}
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
            <p className="text-xs text-destructive">
              {localizeFieldError(errors.amount, t.form.amountRequired, language)}
            </p>
          )}
        </div>

        {/* ক্যাটাগরি ও ওয়ালেট */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rec-cat" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.recurring.categoryLabel}
            </Label>
            <select id="rec-cat" {...register('categoryId')} className={selectClass}>
              <option value="">{t.transactions.selectCategory}</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-xs text-destructive">
                {localizeFieldError(errors.categoryId, t.form.categoryRequired, language)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rec-wallet" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.common.walletAccount}
            </Label>
            <select id="rec-wallet" {...register('walletId')} className={selectClass}>
              <option value="">{t.transactions.selectWallet}</option>
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
        </div>

        {/* ফ্রিকোয়েন্সি ও তারিখ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rec-frequency" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.recurring.period}
            </Label>
            <select id="rec-frequency" {...register('frequency')} className={selectClass}>
              <option value="monthly">{t.recurring.monthly}</option>
              <option value="weekly">{t.recurring.weekly}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rec-day" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.recurring.dayOfMonthLabel}
            </Label>
            <Input
              id="rec-day"
              type="number"
              min={1}
              max={31}
              {...register('dayOfMonth', { valueAsNumber: true })}
              className="h-10 text-sm bg-card"
            />
            {errors.dayOfMonth && (
              <p className="text-xs text-destructive">
                {localizeFieldError(errors.dayOfMonth, t.form.dayOfMonthInvalid, language)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rec-next-due" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.recurring.nextDueLabel}
            </Label>
            <Input
              id="rec-next-due"
              type="date"
              {...register('nextDueOn')}
              className="h-10 text-sm bg-card"
            />
            {errors.nextDueOn && (
              <p className="text-xs text-destructive">
                {localizeFieldError(errors.nextDueOn, t.form.dateInvalid, language)}
              </p>
            )}
          </div>
        </div>

        {/* নোট বা বিবরণ */}
        <div className="space-y-1.5">
          <Label htmlFor="rec-note" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.common.noteOrDescription}
          </Label>
          <Input
            id="rec-note"
            placeholder={t.recurring.notePlaceholder}
            {...register('note')}
            className="h-10 text-sm bg-card"
          />
          {errors.note && (
            <p className="text-xs text-destructive">
              {localizeFieldError(errors.note, t.form.invalidValue, language)}
            </p>
          )}
        </div>

        {/* চালু / স্থগিত (শুধু সম্পাদনার সময়) */}
        {isEditing && (
          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="font-medium text-foreground">{t.recurring.activeStatus}</span>
          </label>
        )}

        {/* অ্যাকশন বাটনসমূহ */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="min-w-[120px]"
          >
            {isSubmitting || createMutation.isPending || updateMutation.isPending
              ? t.common.saving
              : isEditing
              ? t.common.saveChanges
              : t.common.create}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
