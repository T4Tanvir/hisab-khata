import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWalletSchema, type CreateWalletInput, WALLET_TYPES } from '@hisab/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCreateWallet } from './hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { localizeFieldError } from '@/lib/form-errors';
import { AlertCircle } from 'lucide-react';

interface WalletFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WalletType = (typeof WALLET_TYPES)[number];

const WALLET_TYPE_OPTION_KEYS: Array<{ value: WalletType; key: 'optCash' | 'optBank' | 'optMobile' | 'optCard' }> = [
  { value: 'cash', key: 'optCash' },
  { value: 'bank', key: 'optBank' },
  { value: 'mobile', key: 'optMobile' },
  { value: 'card', key: 'optCard' },
];

export const WalletFormModal: React.FC<WalletFormModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const createWalletMutation = useCreateWallet();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Start from a clean form every time the modal opens (also after cancel/close)
  useEffect(() => {
    if (!isOpen) return;
    reset({ name: '', type: 'cash', openingBalance: 0 });
    setErrorMsg(null);
  }, [isOpen, reset]);

  const onSubmit = async (data: CreateWalletInput) => {
    setErrorMsg(null);
    try {
      await createWalletMutation.mutateAsync(data);
      reset();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || t.wallets.createError);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.wallets.formTitle}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <Input
          label={t.wallets.nameLabel}
          placeholder={t.wallets.namePlaceholder}
          error={localizeFieldError(errors.name, t.wallets.nameRequired, language)}
          {...register('name')}
        />

        <div className="space-y-1.5">
          <Label htmlFor="wallet-type">{t.wallets.typeLabel}</Label>
          <select
            id="wallet-type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors"
            {...register('type')}
          >
            {WALLET_TYPE_OPTION_KEYS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t.wallets[opt.key]}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="text-xs font-medium text-destructive mt-1.5">{localizeFieldError(errors.type, t.wallets.typeInvalid, language)}</p>
          )}
        </div>

        <Input
          label={t.wallets.balanceLabel}
          type="number"
          step="any"
          placeholder={t.wallets.balancePlaceholder}
          error={localizeFieldError(errors.openingBalance, t.form.invalidNumber, language)}
          {...register('openingBalance')}
        />

        <div className="flex justify-end gap-2.5 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="default" isLoading={isSubmitting || createWalletMutation.isPending}>
            {t.common.saveNew}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
