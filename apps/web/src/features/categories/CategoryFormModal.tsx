import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, type CreateCategoryInput, CATEGORY_COLORS } from '@hisab/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCreateCategory } from './hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { interpolate } from '@/i18n/interpolate';
import { localizeFieldError } from '@/lib/form-errors';
import { AlertCircle } from 'lucide-react';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'income' | 'expense';
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
}) => {
  const { t, language, formatNumber } = useLanguage();
  const createCategoryMutation = useCreateCategory();
  const [selectedColor, setSelectedColor] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      type: defaultType,
      shortLabel: '',
      color: 1,
    },
  });

  const categoryType = watch('type');

  // Start from a clean form (and default colour) every time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    reset({ name: '', type: defaultType, shortLabel: '', color: 1 });
    setSelectedColor(1);
    setErrorMsg(null);
  }, [isOpen, defaultType, reset]);

  const onSubmit = async (data: CreateCategoryInput) => {
    setErrorMsg(null);
    try {
      await createCategoryMutation.mutateAsync({
        ...data,
        color: selectedColor,
      });
      reset();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || t.categories.createError);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.categories.formTitle}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Type selector */}
        <div className="space-y-1.5">
          <Label>{t.categories.typeLabel}</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={categoryType === 'expense' ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setValue('type', 'expense')}
            >
              {t.categories.expenseType}
            </Button>
            <Button
              type="button"
              variant={categoryType === 'income' ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setValue('type', 'income')}
            >
              {t.categories.incomeType}
            </Button>
          </div>
        </div>

        <Input
          label={t.categories.nameLabel}
          placeholder={t.categories.namePlaceholder}
          error={localizeFieldError(errors.name, t.categories.nameRequired, language)}
          {...register('name')}
          onChange={(e) => {
            register('name').onChange(e);
            const val = e.target.value.trim();
            if (val.length > 0) {
              setValue('shortLabel', val.slice(0, 2));
            }
          }}
        />

        <Input
          label={t.categories.shortLabel}
          placeholder={t.categories.shortLabelPlaceholder}
          maxLength={4}
          error={localizeFieldError(errors.shortLabel, t.categories.shortLabelRequired, language)}
          {...register('shortLabel')}
        />

        {/* Color Palette */}
        <div className="space-y-2">
          <Label>{t.categories.colorLabel}</Label>
          <div className="flex flex-wrap gap-2 pt-1">
            {CATEGORY_COLORS.map((colorVal, idx) => {
              const colorNum = idx + 1;
              const isSelected = selectedColor === colorNum;
              return (
                <button
                  key={colorNum}
                  type="button"
                  onClick={() => {
                    setSelectedColor(colorNum);
                    setValue('color', colorNum);
                  }}
                  className={`w-8 h-8 rounded-full transition-transform outline-none ${
                    isSelected ? 'ring-2 ring-foreground ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: colorVal }}
                  aria-label={interpolate(t.categories.colorAria, { n: formatNumber(colorNum) })}
                />
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="default" isLoading={isSubmitting || createCategoryMutation.isPending}>
            {t.common.saveNew}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
