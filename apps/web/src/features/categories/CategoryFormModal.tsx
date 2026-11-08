import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, type CreateCategoryInput, CATEGORY_COLORS } from '@hisab/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateCategory } from './hooks';

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
  const createCategoryMutation = useCreateCategory();
  const [selectedColor, setSelectedColor] = useState<number>(1);

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

  const onSubmit = async (data: CreateCategoryInput) => {
    try {
      await createCategoryMutation.mutateAsync({
        ...data,
        color: selectedColor,
      });
      reset();
      onClose();
    } catch (err: any) {
      alert(err.message || 'ক্যাটাগরি তৈরি করতে সমস্যা হয়েছে');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="নতুন খাত / ক্যাটাগরি যোগ করুন">
      <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ border: 'none', padding: 0 }}>
        {/* Type toggle */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem' }}>
            খাতের ধরন
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn ${categoryType === 'expense' ? 'primary' : 'btn-ghost'}`}
              style={{ flex: 1 }}
              onClick={() => setValue('type', 'expense')}
            >
              খরচের খাত
            </button>
            <button
              type="button"
              className={`btn ${categoryType === 'income' ? 'primary' : 'btn-ghost'}`}
              style={{ flex: 1 }}
              onClick={() => setValue('type', 'income')}
            >
              আয়ের খাত
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <Input
            label="খাতের নাম"
            placeholder="যেমন: ইন্টারনেট বিল, উপহার, বই কেনা"
            error={errors.name?.message}
            {...register('name')}
            onChange={(e) => {
              register('name').onChange(e);
              // Auto-fill short label with first letter if not typed
              const val = e.target.value.trim();
              if (val.length > 0) {
                setValue('shortLabel', val.slice(0, 2));
              }
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <Input
            label="সংক্ষিপ্ত প্রতীক / অক্ষর (সর্বোচ্চ ৪ অক্ষর)"
            placeholder="খা, বিল, বই"
            maxLength={4}
            error={errors.shortLabel?.message}
            {...register('shortLabel')}
          />
        </div>

        {/* Color Palette */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem' }}>
            চিহ্নিতকারী রং নির্বাচন করুন
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: colorVal,
                    border: isSelected ? '3px solid var(--ink)' : '2px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                  aria-label={`রং ${colorNum}`}
                />
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            বাতিল
          </Button>
          <Button type="submit" isLoading={isSubmitting || createCategoryMutation.isPending}>
            সংরক্ষণ করুন
          </Button>
        </div>
      </form>
    </Modal>
  );
};
