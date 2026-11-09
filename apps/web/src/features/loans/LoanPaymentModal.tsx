import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createLoanPaymentSchema,
  type CreateLoanPaymentInput,
  type Loan,
  type Wallet,
  getDhakaDate,
  paisaToTaka,
} from '@hisab/shared';
import { useCreateLoanPayment } from './hooks';
import { useWallets } from '../wallets/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { Money } from '@/components/Money';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { interpolate } from '@/i18n/interpolate';
import { localizeFieldError } from '@/lib/form-errors';
import {
  Zap,
  AlertCircle,
} from 'lucide-react';

// Stable fallback: a fresh `[]` on every render would retrigger effects while queries load
const NO_WALLETS: Wallet[] = [];

interface LoanPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
}

export const LoanPaymentModal: React.FC<LoanPaymentModalProps> = ({
  isOpen,
  onClose,
  loan,
}) => {
  const { t, language, formatAmount } = useLanguage();
  const { data: wallets = NO_WALLETS } = useWallets();
  const paymentMutation = useCreateLoanPayment();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLoanPaymentInput>({
    resolver: zodResolver(createLoanPaymentSchema),
    defaultValues: {
      amount: 0,
      walletId: '',
      occurredOn: getDhakaDate(),
      note: '',
    },
  });

  const remainingTaka = loan ? paisaToTaka(loan.remaining) : 0;
  const isBorrowed = loan?.direction === 'borrowed';

  // Reset only when the modal opens (or the loan changes) — a wallet refetch
  // must never wipe what the user is typing.
  useEffect(() => {
    if (isOpen && loan) {
      setErrorMsg(null);
      reset({
        amount: 0,
        walletId: '',
        occurredOn: getDhakaDate(),
        note: '',
      });
    }
  }, [isOpen, loan, reset]);

  // Default wallet once the list is available (only if none is selected yet)
  useEffect(() => {
    if (!isOpen) return;
    if (!getValues('walletId') && wallets[0]) {
      setValue('walletId', wallets[0].id);
    }
  }, [isOpen, wallets, getValues, setValue]);

  if (!loan) return null;

  const handleFillFullAmount = () => {
    setValue('amount', remainingTaka);
  };

  const onSubmit = async (data: CreateLoanPaymentInput) => {
    setErrorMsg(null);
    if (data.amount > remainingTaka) {
      setErrorMsg(interpolate(t.loans.overpayError, { amount: formatAmount(loan.remaining) }));
      return;
    }

    try {
      await paymentMutation.mutateAsync({
        id: loan.id,
        data: {
          ...data,
          note: data.note?.trim() || null,
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || t.loans.paymentError);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isBorrowed ? t.loans.repayTitle : t.loans.collectTitle} — ${loan.personName}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        {errorMsg && (
          <div className="p-3 text-xs sm:text-sm rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* বাকি টাকার হাইলাইট কার্ড */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground font-medium">
              {t.loans.currentRemaining}
            </p>
            <p className="font-display text-xl font-bold text-foreground">
              <Money amount={loan.remaining} />
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFillFullAmount}
            className="text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Zap className="h-3.5 w-3.5" />
            {t.loans.payFull}
          </Button>
        </div>

        {/* পরিশোধের টাকার পরিমাণ */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            {isBorrowed ? t.loans.repayAmount : t.loans.collectAmount} (৳) *
          </Label>
          <Input
            type="number"
            step="any"
            placeholder="0.00"
            max={remainingTaka}
            {...register('amount', { valueAsNumber: true })}
            error={localizeFieldError(errors.amount, t.form.amountRequired, language)}
          />
        </div>

        {/* ওয়ালেট নির্বাচন */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            {isBorrowed ? t.loans.repayWallet : t.loans.collectWallet} *
          </Label>
          <select
            {...register('walletId')}
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

        {/* পরিশোধের তারিখ */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">{t.common.date} *</Label>
          <Input
            type="date"
            {...register('occurredOn')}
            error={localizeFieldError(errors.occurredOn, t.form.dateInvalid, language)}
          />
        </div>

        {/* নোট */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">{t.common.note}</Label>
          <Input
            placeholder={
              interpolate(isBorrowed ? t.loans.repayNote : t.loans.collectNote, {
                name: loan.personName,
              })
            }
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
            {isBorrowed ? t.loans.makePayment : t.loans.recordPayment}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
