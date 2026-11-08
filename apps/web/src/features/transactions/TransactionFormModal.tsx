import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTransactionSchema,
  getDhakaDate,
  getDhakaDateDaysAgo,
  paisaToTaka,
  parseTransactionSms,
  type Category,
  type CreateTransactionInput,
  type Transaction,
  type Wallet,
} from '@hisab/shared';
import { useCreateTransaction, useUpdateTransaction } from './hooks';
import { useWallets } from '../wallets/hooks';
import { useCategories } from '../categories/hooks';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, Sparkles, CheckCircle2 } from 'lucide-react';
import type { BudgetAlert } from './api';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  defaultType?: 'expense' | 'income' | 'transfer';
  onSuccess?: (alert?: BudgetAlert | null) => void;
}

// Stable fallbacks: a fresh `[]` on every render would retrigger effects while queries load
const NO_WALLETS: Wallet[] = [];
const NO_CATEGORIES: Category[] = [];

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
  defaultType = 'expense',
  onSuccess,
}) => {
  const { data: activeWallets = NO_WALLETS } = useWallets();
  const { data: categories = NO_CATEGORIES } = useCategories();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();

  const [serverError, setServerError] = useState<string | null>(null);
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [smsFeedback, setSmsFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const isEditing = Boolean(transactionToEdit);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: defaultType,
      amount: '' as any,
      walletId: '',
      toWalletId: null,
      categoryId: null,
      occurredOn: getDhakaDate(),
      note: '',
    },
  });

  const selectedType = watch('type');
  const selectedWalletId = watch('walletId');
  const selectedCategoryId = watch('categoryId');
  const selectedOccurredOn = watch('occurredOn');

  // Reset or populate the form only when the modal opens (or the edited item changes).
  // Wallet/category lists are deliberately NOT dependencies: a background refetch
  // must never wipe what the user is typing.
  useEffect(() => {
    if (!isOpen) return;
    setServerError(null);

    if (transactionToEdit) {
      reset({
        type: transactionToEdit.type,
        amount: paisaToTaka(transactionToEdit.amount),
        walletId: transactionToEdit.walletId,
        toWalletId: transactionToEdit.toWalletId || null,
        categoryId: transactionToEdit.categoryId || null,
        occurredOn: transactionToEdit.occurredOn,
        note: transactionToEdit.note || '',
      });
    } else {
      reset({
        type: defaultType,
        amount: '' as any,
        walletId: '',
        toWalletId: null,
        categoryId: null,
        occurredOn: getDhakaDate(),
        note: '',
      });
    }
  }, [isOpen, transactionToEdit, defaultType, reset]);

  // For a new transaction, fill in a default wallet/category once the lists are
  // available — only into fields that are still empty.
  useEffect(() => {
    if (!isOpen || isEditing) return;
    const type = getValues('type');

    if (!getValues('walletId') && activeWallets[0]) {
      setValue('walletId', activeWallets[0].id);
    }
    if (type !== 'transfer' && !getValues('categoryId')) {
      const firstCategory = categories.find((c) => c.type === type);
      if (firstCategory) setValue('categoryId', firstCategory.id);
    }
  }, [isOpen, isEditing, activeWallets, categories, getValues, setValue]);

  // When editing a transaction whose wallet was archived, keep it selectable
  // so the dropdown shows the real value instead of a different wallet.
  const wallets = useMemo(() => {
    if (!transactionToEdit) return activeWallets;
    const extra: Wallet[] = [];
    const ensure = (id?: string | null, name?: string | null) => {
      if (id && !activeWallets.some((w) => w.id === id) && !extra.some((w) => w.id === id)) {
        extra.push({ id, name: `${name ?? 'ওয়ালেট'} (আর্কাইভ)` } as Wallet);
      }
    };
    ensure(transactionToEdit.walletId, transactionToEdit.walletName);
    ensure(transactionToEdit.toWalletId, transactionToEdit.toWalletName);
    return extra.length ? [...activeWallets, ...extra] : activeWallets;
  }, [activeWallets, transactionToEdit]);

  // Categories filtered by the selected transaction type
  const availableCategories = categories.filter((c) => c.type === selectedType);

  const handleParseSms = () => {
    setSmsFeedback(null);
    if (!smsText.trim()) return;

    const parsed = parseTransactionSms(smsText);
    if (!parsed) {
      setSmsFeedback({
        success: false,
        message: 'কোনো পরিচিত লেনদেনের তথ্য পাওয়া যায়নি। বিকাশ, নগদ বা ব্যাংক SMS দিন।',
      });
      return;
    }

    setValue('type', parsed.type, { shouldValidate: true });
    setValue('amount', parsed.amount as any, { shouldValidate: true });
    setValue('note', parsed.note, { shouldValidate: true });
    if (parsed.date) {
      setValue('occurredOn', parsed.date, { shouldValidate: true });
    }

    // Auto-select category for expenses if not already selected
    if (parsed.type === 'expense' && !getValues('categoryId')) {
      const defaultExpCat = categories.find((c) => c.type === 'expense');
      if (defaultExpCat) setValue('categoryId', defaultExpCat.id);
    } else if (parsed.type === 'income' && !getValues('categoryId')) {
      const defaultIncCat = categories.find((c) => c.type === 'income');
      if (defaultIncCat) setValue('categoryId', defaultIncCat.id);
    }

    // Try to auto-select matching wallet (bKash, Nagad, Rocket, Bank)
    const provLower = parsed.provider.toLowerCase();
    const matchedWallet = activeWallets.find((w) => {
      const name = w.name.toLowerCase();
      if (provLower === 'bkash') return name.includes('bkash') || name.includes('বিকাশ');
      if (provLower === 'nagad') return name.includes('nagad') || name.includes('নগদ');
      if (provLower === 'rocket') return name.includes('rocket') || name.includes('রকেট') || name.includes('dbbl');
      if (provLower === 'bank') return name.includes('bank') || name.includes('ব্যাংক') || name.includes('city') || name.includes('brac');
      return false;
    });

    if (matchedWallet) {
      setValue('walletId', matchedWallet.id, { shouldValidate: true });
    }

    setSmsFeedback({
      success: true,
      message: `SMS সফলভাবে পূরণ হয়েছে! (${parsed.provider}: ৳${parsed.amount})`,
    });
  };

  const onSubmit = async (data: CreateTransactionInput) => {
    setServerError(null);

    try {
      const res =
        isEditing && transactionToEdit
          ? await updateTx.mutateAsync({
              id: transactionToEdit.id,
              data: {
                amount: data.amount,
                walletId: data.walletId,
                toWalletId: data.type === 'transfer' ? data.toWalletId : null,
                categoryId: data.type !== 'transfer' ? data.categoryId : null,
                occurredOn: data.occurredOn,
                note: data.note,
              },
            })
          : await createTx.mutateAsync(data);

      // The modal closes right away, so the parent page shows any budget warning
      onSuccess?.(res.budgetAlert ?? null);
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'লেনদেন সংরক্ষণ করা সম্ভব হয়নি');
    }
  };

  // Dates are always Asia/Dhaka calendar days (not the browser's UTC date)
  const handleSetQuickDate = (daysAgo: number) => {
    setValue('occurredOn', getDhakaDateDaysAgo(daysAgo), { shouldValidate: true });
  };

  const isToday = selectedOccurredOn === getDhakaDate();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'লেনদেন সম্পাদনা' : 'নতুন লেনদেন'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Server Error Message */}
        {serverError && (
          <div className="flex items-center gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* লেনদেনের ধরণ (খরচ / আয় / ট্রান্সফার) */}
        {!isEditing && (
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/50 rounded-xl border">
            <button
              type="button"
              onClick={() => {
                setValue('type', 'expense');
                const cat = categories.find((c) => c.type === 'expense');
                setValue('categoryId', cat?.id || null);
                setValue('toWalletId', null);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                selectedType === 'expense'
                  ? 'bg-card text-neg shadow-sm'
                  : 'text-muted-foreground hover:text-neg'
              }`}
            >
              খরচ
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('type', 'income');
                const cat = categories.find((c) => c.type === 'income');
                setValue('categoryId', cat?.id || null);
                setValue('toWalletId', null);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                selectedType === 'income'
                  ? 'bg-card text-pos shadow-sm'
                  : 'text-muted-foreground hover:text-pos'
              }`}
            >
              আয়
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('type', 'transfer');
                setValue('categoryId', null);
                const secondWallet = wallets.find((w) => w.id !== selectedWalletId);
                setValue('toWalletId', secondWallet?.id || null);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                selectedType === 'transfer'
                  ? 'bg-card text-blue-500 shadow-sm'
                  : 'text-muted-foreground hover:text-blue-500'
              }`}
            >
              ট্রান্সফার
            </button>
          </div>
        )}

        {/* SMS থেকে লেনদেন পূরণ (Smart SMS Parser) */}
        {!isEditing && (
          <div className="rounded-xl border border-border/70 overflow-hidden bg-card/60">
            <button
              type="button"
              onClick={() => {
                setShowSmsInput(!showSmsInput);
                setSmsFeedback(null);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>বিকাশ, নগদ বা ব্যাংক SMS থেকে অটো-ফিল</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {showSmsInput ? 'লুকান ▲' : 'পেস্ট করুন ▼'}
              </span>
            </button>

            {showSmsInput && (
              <div className="p-3 border-t border-border/50 space-y-2.5 bg-muted/20">
                <textarea
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="বিকাশ, নগদ বা ব্যাংক থেকে আসা SMS মেসেজটি এখানে পেস্ট করুন..."
                  className="w-full h-16 text-xs p-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleParseSms}
                    className="h-7 text-xs gap-1.5 font-semibold self-start"
                  >
                    <Sparkles className="h-3 w-3" />
                    পার্স ও পূরণ করুন
                  </Button>
                  {smsFeedback && (
                    <span
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        smsFeedback.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                      }`}
                    >
                      {smsFeedback.success ? (
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3 w-3 shrink-0" />
                      )}
                      {smsFeedback.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* টাকার পরিমাণ (Amount Input) */}
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            টাকার পরিমাণ (৳)
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground select-none">
              ৳
            </span>
            <Input
              id="amount"
              type="number"
              step="any"
              autoFocus
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              className={`pl-9 text-xl sm:text-2xl font-bold font-mono h-12 ${
                selectedType === 'income'
                  ? 'text-pos focus-visible:ring-pos'
                  : selectedType === 'expense'
                  ? 'text-neg focus-visible:ring-neg'
                  : 'text-blue-500 focus-visible:ring-blue-500'
              }`}
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>

        {/* ক্যাটাগরি সিলেকশন (খরচ বা আয়ের ক্ষেত্রে) */}
        {selectedType !== 'transfer' && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ক্যাটাগরি
            </Label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border rounded-xl bg-card">
              {availableCategories.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">কোনো ক্যাটাগরি তৈরি করা নেই</p>
              ) : (
                availableCategories.map((c) => {
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setValue('categoryId', c.id, { shouldValidate: true })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm ring-1 ring-primary'
                          : 'border-border/60 bg-muted/30 text-foreground hover:bg-accent'
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: `var(--c${c.color || 1})` }}
                      />
                      <span>{c.name}</span>
                      {c.shortLabel && (
                        <span className="text-[10px] text-muted-foreground">
                          ({c.shortLabel})
                        </span>
                      )}
                      {isSelected && <Check className="h-3 w-3 ml-0.5 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId.message}</p>
            )}
          </div>
        )}

        {/* ওয়ালেট সিলেকশন */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="walletId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {selectedType === 'transfer' ? 'যে ওয়ালেট থেকে' : 'ওয়ালেট / অ্যাকাউন্ট'}
            </Label>
            <select
              id="walletId"
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

          {selectedType === 'transfer' && (
            <div className="space-y-1.5">
              <Label htmlFor="toWalletId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                যে ওয়ালেটে যাবে
              </Label>
              <select
                id="toWalletId"
                {...register('toWalletId')}
                className="w-full h-10 rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">গ্রহীতা ওয়ালেট নির্বাচন করুন</option>
                {wallets
                  .filter((w) => w.id !== selectedWalletId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
              </select>
              {errors.toWalletId && (
                <p className="text-xs text-destructive">{errors.toWalletId.message}</p>
              )}
            </div>
          )}
        </div>

        {/* তারিখ (Date Picker & Quick Buttons) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="occurredOn" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              তারিখ
            </Label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetQuickDate(0)}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  isToday ? 'bg-primary text-primary-foreground font-semibold' : 'bg-muted hover:bg-accent text-foreground'
                }`}
              >
                আজ
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate(1)}
                className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-accent text-foreground transition-colors"
              >
                গতকাল
              </button>
            </div>
          </div>
          <Input
            id="occurredOn"
            type="date"
            {...register('occurredOn')}
            className="h-10 text-sm bg-card"
          />
          {errors.occurredOn && (
            <p className="text-xs text-destructive">{errors.occurredOn.message}</p>
          )}
        </div>

        {/* নোট বা বিবরণ */}
        <div className="space-y-1.5">
          <Label htmlFor="note" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            নোট বা বিবরণ (ঐচ্ছিক)
          </Label>
          <Input
            id="note"
            type="text"
            placeholder="যেমন: বাজার খরচ, বোনাস, ভাড়া..."
            {...register('note')}
            className="h-10 text-sm bg-card"
          />
          {errors.note && (
            <p className="text-xs text-destructive">{errors.note.message}</p>
          )}
        </div>

        {/* অ্যাকশন বাটনসমূহ */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            বাতিল
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createTx.isPending || updateTx.isPending}
            className="min-w-[120px]"
          >
            {isSubmitting || createTx.isPending || updateTx.isPending
              ? 'সংরক্ষণ হচ্ছে...'
              : isEditing
              ? 'পরিবর্তন সংরক্ষণ'
              : 'সংরক্ষণ করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
