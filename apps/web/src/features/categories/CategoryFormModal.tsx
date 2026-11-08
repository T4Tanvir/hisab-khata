import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, type CreateCategoryInput, CATEGORY_COLORS } from '@hisab/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type selector */}
        <div className="space-y-1.5">
          <Label>খাতের ধরন</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={categoryType === 'expense' ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setValue('type', 'expense')}
            >
              খরচের খাত
            </Button>
            <Button
              type="button"
              variant={categoryType === 'income' ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setValue('type', 'income')}
            >
              আয়ের খাত
            </Button>
          </div>
        </div>

        <Input
          label="খাতের নাম"
          placeholder="যেমন: ইন্টারনেট বিল, উপহার, বই কেনা"
          error={errors.name?.message}
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
          label="সংক্ষিপ্ত প্রতীক / অক্ষর (সর্বোচ্চ ৪ অক্ষর)"
          placeholder="খা, বিল, বই"
          maxLength={4}
          error={errors.shortLabel?.message}
          {...register('shortLabel')}
        />

        {/* Color Palette */}
        <div className="space-y-2">
          <Label>চিহ্নিতকারী রং নির্বাচন করুন</Label>
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
                  aria-label={`রং ${colorNum}`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>
            বাতিল
          </Button>
          <Button type="submit" variant="default" isLoading={isSubmitting || createCategoryMutation.isPending}>
            সংরক্ষণ করুন
          </Button>
        </div>
      </form>
    </Modal>
  );
};
