import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createLoanSchema,
  updateLoanSchema,
  type CreateLoanInput,
  type UpdateLoanInput,
  type Loan,
  type Wallet,
  getDhakaDate,
  paisaToTaka,
} from '@hisab/shared';
import { useCreateLoan, useUpdateLoan } from './hooks';
import { useWallets } from '../wallets/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localizeFieldError } from '@/lib/form-errors';
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';

// Stable fallback: a fresh `[]` on every render would retrigger effects while queries load
const NO_WALLETS: Wallet[] = [];

interface LoanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan?: Loan | null;
}

export const LoanFormModal: React.FC<LoanFormModalProps> = ({
  isOpen,
  onClose,
  loan,
}) => {
  const isEditing = !!loan;
  const { t, language, formatAmount } = useLanguage();
  const { data: wallets = NO_WALLETS } = useWallets();
  const createMutation = useCreateLoan();
  const updateMutation = useUpdateLoan();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLoanInput>({
    resolver: zodResolver(isEditing ? updateLoanSchema : createLoanSchema),
    defaultValues: {
      direction: 'borrowed',
      personName: '',
      personPhone: '',
      principal: 0,
      startedOn: getDhakaDate(),
      dueOn: '',
      note: '',
      affectWallet: true,
      walletId: '',
    },
  });

  const selectedDirection = watch('direction');
  const affectWallet = watch('affectWallet');
  const selectedWalletId = watch('walletId');

  // Reset only when the modal opens (or the edited loan changes) — a wallet
  // refetch must never wipe what the user is typing.
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (loan) {
        reset({
          direction: loan.direction,
          personName: loan.personName,
          personPhone: loan.personPhone || '',
          principal: paisaToTaka(loan.principal),
          startedOn: loan.startedOn,
          dueOn: loan.dueOn || '',
          note: loan.note || '',
          affectWallet: false,
          walletId: '',
        });
      } else {
        reset({
          direction: 'borrowed',
          personName: '',
          personPhone: '',
          principal: 0,
          startedOn: getDhakaDate(),
          dueOn: '',
          note: '',
          affectWallet: true,
          walletId: '',
        });
      }
    }
  }, [isOpen, loan, reset]);

  // Default wallet for a new loan once the list is available (only if still empty)
  useEffect(() => {
    if (!isOpen || isEditing) return;
    if (!getValues('walletId') && wallets[0]) {
      setValue('walletId', wallets[0].id);
    }
  }, [isOpen, isEditing, wallets, getValues, setValue]);

  const onSubmit = async (data: CreateLoanInput) => {
    setErrorMsg(null);
    try {
      if (isEditing && loan) {
        const updateData: UpdateLoanInput = {
          personName: data.personName,
          personPhone: data.personPhone || null,
          principal: data.principal,
          startedOn: data.startedOn,
          dueOn: data.dueOn || null,
          note: data.note || null,
        };
        await updateMutation.mutateAsync({ id: loan.id, data: updateData });
      } else {
        await createMutation.mutateAsync({
          ...data,
          personPhone: data.personPhone || null,
          dueOn: data.dueOn || null,
          note: data.note || null,
          walletId: data.affectWallet ? data.walletId : null,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || t.loans.saveError);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t.loans.editTitle : t.loans.newLoan}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        {errorMsg && (
          <div className="p-3 text-xs sm:text-sm rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* লোনের ধরন (দেনা / পাওনা) — শুধু নতুন লোন তৈরির ক্ষেত্রে পরিবর্তনযোগ্য */}
        {!isEditing && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t.loans.typeLabel}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('direction', 'borrowed')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  selectedDirection === 'borrowed'
                    ? 'border-destructive bg-destructive/10 text-destructive font-semibold shadow-xs ring-1 ring-destructive'
                    : 'border-border/70 hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="h-7 w-7 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowDownLeft className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-tight">{t.loans.borrowed}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t.loans.borrowedHint}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue('direction', 'lent')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  selectedDirection === 'lent'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 font-semibold shadow-xs ring-1 ring-emerald-600'
                    : 'border-border/70 hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-tight">{t.loans.lent}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t.loans.lentHint}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ব্যক্তির নাম ও ফোন নম্বর */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              {selectedDirection === 'borrowed' ? t.loans.borrowedFrom : t.loans.lentTo} *
            </Label>
            <Input
              placeholder={t.loans.personPlaceholder}
              {...register('personName')}
              error={localizeFieldError(errors.personName, t.form.invalidValue, language)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">{t.loans.personPhone}</Label>
            <Input
              placeholder="017xxxxxxxx"
              {...register('personPhone')}
              error={localizeFieldError(errors.personPhone, t.form.invalidValue, language)}
            />
          </div>
        </div>

        {/* টাকার পরিমাণ (মূল টাকা) */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">{t.loans.principal} (৳) *</Label>
          <Input
            type="number"
            step="any"
            placeholder="0.00"
            {...register('principal', { valueAsNumber: true })}
            error={localizeFieldError(errors.principal, t.form.amountRequired, language)}
          />
        </div>

        {/* শুরুর তারিখ ও শেষ তারিখ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">{t.loans.startedOn} *</Label>
            <Input
              type="date"
              {...register('startedOn')}
              error={localizeFieldError(errors.startedOn, t.form.dateInvalid, language)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              {t.loans.dueOn} {t.common.optionalSuffix}
            </Label>
            <Input
              type="date"
              {...register('dueOn')}
              error={localizeFieldError(errors.dueOn, t.form.dateInvalid, language)}
            />
          </div>
        </div>

        {/* ওয়ালেটে লেনদেন যোগ করার অপশন (শুধু নতুন লোনের জন্য) */}
        {!isEditing && (
          <div className="space-y-3 p-3.5 rounded-xl bg-muted/40 border border-border/60">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                checked={affectWallet}
                onChange={(e) => setValue('affectWallet', e.target.checked)}
              />
              <div className="text-xs">
                <p className="font-semibold text-foreground">
                  {t.loans.affectWallet}
                </p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">
                  {affectWallet
                    ? selectedDirection === 'borrowed'
                      ? t.loans.walletAddHint
                      : t.loans.walletDeductHint
                    : t.loans.affectWalletHelp}
                </p>
              </div>
            </label>

            {affectWallet && (
              <div className="space-y-1 pt-1">
                <Label className="text-xs font-semibold">
                  {selectedDirection === 'borrowed' ? t.loans.walletInLabel : t.loans.walletOutLabel} *
                </Label>
                <select
                  value={selectedWalletId || ''}
                  onChange={(e) => setValue('walletId', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-hidden"
                >
                  <option value="" disabled>
                    {t.common.selectAWallet}
                  </option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({t.common.balance}: {formatAmount(w.currentBalance)})
                    </option>
                  ))}
                </select>
                {errors.walletId && (
                  <p className="text-[11px] text-destructive">
                    {localizeFieldError(errors.walletId, t.form.walletRequired, language)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* নোট */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">{t.common.note}</Label>
          <Input
            placeholder={t.loans.notePlaceholder}
            {...register('note')}
            error={localizeFieldError(errors.note, t.form.invalidValue, language)}
          />
        </div>

        {/* বাটনসমূহ */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-border/70"
          >
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="font-semibold shadow-xs"
          >
            {isEditing ? t.common.save : t.loans.newLoan}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
