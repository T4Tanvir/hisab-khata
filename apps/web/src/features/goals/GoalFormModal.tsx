import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGoalSchema, type CreateGoalInput, type Goal, paisaToTaka } from '@hisab/shared';
import { useCreateGoal, useUpdateGoal } from './hooks';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
}

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
}) => {
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEditing = Boolean(goalToEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      name: '',
      targetAmount: '' as any,
      dueMonth: '',
      note: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (goalToEdit) {
        reset({
          name: goalToEdit.name,
          targetAmount: paisaToTaka(goalToEdit.targetAmount),
          dueMonth: goalToEdit.dueMonth || '',
          note: goalToEdit.note || '',
        });
      } else {
        reset({
          name: '',
          targetAmount: '' as any,
          dueMonth: '',
          note: '',
        });
      }
    }
  }, [isOpen, goalToEdit, reset]);

  const onSubmit = async (data: CreateGoalInput) => {
    setErrorMsg(null);
    try {
      if (isEditing && goalToEdit) {
        await updateMutation.mutateAsync({
          id: goalToEdit.id,
          data: {
            name: data.name,
            targetAmount: data.targetAmount,
            dueMonth: data.dueMonth || null,
            note: data.note,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          targetAmount: data.targetAmount,
          dueMonth: data.dueMonth || null,
          note: data.note,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'লক্ষ্য সংরক্ষণ করা যায়নি');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'সঞ্চয়ের লক্ষ্য পরিবর্তন' : 'নতুন সঞ্চয়ের লক্ষ্য'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* লক্ষ্যের নাম */}
        <div className="space-y-1.5">
          <Label htmlFor="goal-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            লক্ষ্যের নাম
          </Label>
          <Input
            id="goal-name"
            autoFocus
            placeholder="যেমন: নতুন ল্যাপটপ, ঈদ বোনাস ফান্ড, জরুরি সঞ্চয়"
            {...register('name')}
            className="h-10 text-sm bg-card"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* টার্গেট পরিমাণ */}
        <div className="space-y-1.5">
          <Label htmlFor="goal-target" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            টার্গেট টাকা (৳)
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground select-none">
              ৳
            </span>
            <Input
              id="goal-target"
              type="number"
              step="any"
              placeholder="0.00"
              {...register('targetAmount', { valueAsNumber: true })}
              className="pl-9 text-xl sm:text-2xl font-bold font-mono h-12 text-foreground focus-visible:ring-primary"
            />
          </div>
          {errors.targetAmount && (
            <p className="text-xs text-destructive">{errors.targetAmount.message}</p>
          )}
        </div>

        {/* সম্ভাব্য মাস */}
        <div className="space-y-1.5">
          <Label htmlFor="goal-due" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            টার্গেট অর্জনের মাস (ঐচ্ছিক)
          </Label>
          <Input
            id="goal-due"
            type="month"
            {...register('dueMonth')}
            className="h-10 text-sm bg-card"
          />
          {errors.dueMonth && (
            <p className="text-xs text-destructive">{errors.dueMonth.message}</p>
          )}
        </div>

        {/* বিবরণ বা নোট */}
        <div className="space-y-1.5">
          <Label htmlFor="goal-note" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            নোট (ঐচ্ছিক)
          </Label>
          <Input
            id="goal-note"
            placeholder="অতিরিক্ত কোনো তথ্য থাকলে লিখুন..."
            {...register('note')}
            className="h-10 text-sm bg-card"
          />
        </div>

        {/* অ্যাকশন বাটনসমূহ */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            বাতিল
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="min-w-[120px]"
          >
            {isSubmitting || createMutation.isPending || updateMutation.isPending
              ? 'সংরক্ষণ হচ্ছে...'
              : isEditing
              ? 'পরিবর্তন সংরক্ষণ'
              : 'তৈরি করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
