import React, { useEffect, useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
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
import { useLanguage } from '@/hooks/useLanguage';
import { localizeFieldError } from '@/lib/form-errors';
import { interpolate } from '@/i18n/interpolate';

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

/** Types the user can pick in this form; others (e.g. 'saving') keep their own type when edited */
const EDITABLE_TYPES = ['income', 'expense', 'transfer'];

const baseResolver = zodResolver(createTransactionSchema);

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

  const { t, language, formatNumber } = useLanguage();
  const isEditing = Boolean(transactionToEdit);
  // e.g. a goal contribution ('saving'): amount/date/note/wallet are editable but
  // the type is locked and it has no category.
  const isLockedTypeEdit = Boolean(
    transactionToEdit && !EDITABLE_TYPES.includes(transactionToEdit.type as string)
  );

  // The create schema only accepts income/expense/transfer, so a locked-type row's
  // editable fields (amount/wallet/date/note) are validated with a stand-in type that
  // needs no category. onSubmit never sends the type, toWalletId or categoryId for it.
  const resolver = useMemo<Resolver<CreateTransactionInput>>(
    () =>
      isLockedTypeEdit
        ? (values, context, options) =>
            baseResolver(
              { ...values, type: 'transfer', toWalletId: '__locked__' } as CreateTransactionInput,
              context,
              options
            )
        : baseResolver,
    [isLockedTypeEdit]
  );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver,
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
        type: transactionToEdit.type as CreateTransactionInput['type'],
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
        extra.push({
          id,
          name: interpolate(t.transactions.archivedWallet, { name: name ?? t.transactions.walletFallback }),
        } as Wallet);
      }
    };
    ensure(transactionToEdit.walletId, transactionToEdit.walletName);
    ensure(transactionToEdit.toWalletId, transactionToEdit.toWalletName);
    return extra.length ? [...activeWallets, ...extra] : activeWallets;
  }, [activeWallets, transactionToEdit, t]);

  // Categories filtered by the selected transaction type
  const availableCategories = categories.filter((c) => c.type === selectedType);

  const handleParseSms = () => {
    setSmsFeedback(null);
    if (!smsText.trim()) return;

    const parsed = parseTransactionSms(smsText);
    if (!parsed) {
      setSmsFeedback({
        success: false,
        message: t.transactions.smsNoMatch,
      });
      return;
    }

    const previousType = getValues('type');
    setValue('type', parsed.type, { shouldValidate: true });
    setValue('toWalletId', null);
    setValue('amount', parsed.amount as any, { shouldValidate: true });
    setValue('note', parsed.note, { shouldValidate: true });
    if (parsed.date) {
      setValue('occurredOn', parsed.date, { shouldValidate: true });
    }

    // A category auto-filled for the previous type (e.g. an expense category) is
    // wrong once the SMS switches the type — reset it to the parsed type's first category.
    const currentCategory = categories.find((c) => c.id === getValues('categoryId'));
    if (
      parsed.type !== previousType ||
      !currentCategory ||
      currentCategory.type !== parsed.type
    ) {
      const firstOfType = categories.find((c) => c.type === parsed.type);
      setValue('categoryId', firstOfType?.id || null, { shouldValidate: true });
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
      message: interpolate(t.transactions.smsSuccess, {
        provider: parsed.provider,
        amount: formatNumber(parsed.amount),
      }),
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
                toWalletId: data.type === 'transfer' && !isLockedTypeEdit ? data.toWalletId : null,
                categoryId: data.type !== 'transfer' && !isLockedTypeEdit ? data.categoryId : null,
                occurredOn: data.occurredOn,
                note: data.note,
              },
            })
          : await createTx.mutateAsync(data);

      // The modal closes right away, so the parent page shows any budget warning
      onSuccess?.(res.budgetAlert ?? null);
      onClose();
    } catch (err: any) {
      setServerError(err.message || t.transactions.saveError);
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
      title={isEditing ? t.transactions.editTitle : t.transactions.newTransaction}
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
              {t.transactions.typeExpense}
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
              {t.transactions.typeIncome}
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
              {t.transactions.typeTransfer}
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
                <span>{t.transactions.smsToggle}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {showSmsInput ? t.transactions.smsHide : t.transactions.smsShow}
              </span>
            </button>

            {showSmsInput && (
              <div className="p-3 border-t border-border/50 space-y-2.5 bg-muted/20">
                <textarea
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder={t.transactions.smsPlaceholder}
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
                    {t.transactions.smsParse}
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
            {t.common.amountTaka}
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
            <p className="text-xs text-destructive">
              {localizeFieldError(errors.amount, t.form.amountRequired, language)}
            </p>
          )}
        </div>

        {/* ক্যাটাগরি সিলেকশন (খরচ বা আয়ের ক্ষেত্রে) */}
        {selectedType !== 'transfer' && !isLockedTypeEdit && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.transactions.categoryLabel}
            </Label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border rounded-xl bg-card">
              {availableCategories.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">{t.transactions.noCategoriesCreated}</p>
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
              <p className="text-xs text-destructive">
                {localizeFieldError(errors.categoryId, t.form.categoryRequired, language)}
              </p>
            )}
          </div>
        )}

        {/* ওয়ালেট সিলেকশন */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="walletId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {selectedType === 'transfer' ? t.transactions.fromWalletLabel : t.common.walletAccount}
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
              <p className="text-xs text-destructive">
                {localizeFieldError(errors.walletId, t.form.walletRequired, language)}
              </p>
            )}
          </div>

          {selectedType === 'transfer' && (
            <div className="space-y-1.5">
              <Label htmlFor="toWalletId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.transactions.toWalletLabel}
              </Label>
              <select
                id="toWalletId"
                {...register('toWalletId')}
                className="w-full h-10 rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">{t.transactions.selectToWallet}</option>
                {wallets
                  .filter((w) => w.id !== selectedWalletId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
              </select>
              {errors.toWalletId && (
                <p className="text-xs text-destructive">
                  {localizeFieldError(errors.toWalletId, t.form.walletRequired, language)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* তারিখ (Date Picker & Quick Buttons) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="occurredOn" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.common.date}
            </Label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetQuickDate(0)}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  isToday ? 'bg-primary text-primary-foreground font-semibold' : 'bg-muted hover:bg-accent text-foreground'
                }`}
              >
                {t.transactions.today}
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate(1)}
                className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-accent text-foreground transition-colors"
              >
                {t.transactions.yesterday}
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
            <p className="text-xs text-destructive">
              {localizeFieldError(errors.occurredOn, t.form.dateInvalid, language)}
            </p>
          )}
        </div>

        {/* নোট বা বিবরণ */}
        <div className="space-y-1.5">
          <Label htmlFor="note" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.common.noteOrDescription}
          </Label>
          <Input
            id="note"
            type="text"
            placeholder={t.transactions.notePlaceholder}
            {...register('note')}
            className="h-10 text-sm bg-card"
          />
          {errors.note && (
            <p className="text-xs text-destructive">
              {localizeFieldError(errors.note, t.form.invalidValue, language)}
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
            disabled={isSubmitting || createTx.isPending || updateTx.isPending}
            className="min-w-[120px]"
          >
            {isSubmitting || createTx.isPending || updateTx.isPending
              ? t.common.saving
              : isEditing
              ? t.common.saveChanges
              : t.common.saveNew}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
