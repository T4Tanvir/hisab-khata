import React, { useState } from 'react';
import {
  useGoals,
  useDeleteGoal,
  GoalCard,
  GoalFormModal,
  ContributeModal,
} from '@/features/goals';
import type { Goal } from '@hisab/shared';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/Money';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Target, Plus, PiggyBank, CheckCircle2 } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const { t } = useLanguage();
  const { data: goals = [], isLoading } = useGoals();
  const deleteGoalMutation = useDeleteGoal();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [goalToContrib, setGoalToContrib] = useState<Goal | null>(null);

  // Overall totals
  const totalTarget = goals.reduce((acc, g) => acc + BigInt(g.targetAmount || '0'), 0n);
  const totalSaved = goals.reduce((acc, g) => acc + BigInt(g.currentAmount || '0'), 0n);
  const totalRemaining = totalTarget > totalSaved ? totalTarget - totalSaved : 0n;

  const handleEdit = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsFormModalOpen(true);
  };

  const handleDelete = (goal: Goal) => {
    setGoalToDelete(goal);
  };

  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;
    await deleteGoalMutation.mutateAsync(goalToDelete.id);
    setGoalToDelete(null);
  };

  const handleContribute = (goal: Goal) => {
    setGoalToContrib(goal);
    setIsContribModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* হেডার */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.goals.title}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            {t.nav.goals}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t.goals.subtitle}
          </p>
        </div>

        <Button
          onClick={() => {
            setGoalToEdit(null);
            setIsFormModalOpen(true);
          }}
          className="gap-2 shadow-sm font-semibold self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          {t.goals.newGoal}
        </Button>
      </div>

      {/* সারসংক্ষেপ কার্ডসমূহ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                মোট লক্ষ্যমাত্রা
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">হিসাব হচ্ছে...</span>
                ) : (
                  <Money amount={totalTarget.toString()} showSign={false} />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{goals.length} টি লক্ষ্য সক্রিয়</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                মোট জমা হয়েছে
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-pos">
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">হিসাব হচ্ছে...</span>
                ) : (
                  <Money amount={totalSaved.toString()} showSign={false} />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {totalTarget > 0n
                  ? `${Math.round(Number((totalSaved * 100n) / totalTarget))}% অর্জিত`
                  : '০%'}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pos/10 text-pos">
              <PiggyBank className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                বাকি সঞ্চয়
              </p>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">হিসাব হচ্ছে...</span>
                ) : (
                  <Money amount={totalRemaining.toString()} showSign={false} />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">টার্গেট পূরণ করতে অবশিষ্ট</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* লক্ষ্য কার্ড তালিকা */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-xl border bg-card/60 animate-pulse p-4 space-y-3" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card className="text-center py-14 px-4 border-dashed">
          <CardContent className="space-y-3">
            <Target className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
            <h3 className="font-bold text-base text-foreground">কোনো সঞ্চয়ের লক্ষ্য নেই</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              নতুন ল্যাপটপ, পরিবারের অনুষ্ঠান বা জরুরি ফান্ডের মতো সঞ্চয়ের লক্ষ্য তৈরি করুন এবং নিয়মিত টাকা জমা রাখুন।
            </p>
            <Button
              onClick={() => {
                setGoalToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="gap-2 mt-2"
            >
              <Plus className="h-4 w-4" /> প্রথম লক্ষ্য তৈরি করুন
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onContribute={handleContribute}
            />
          ))}
        </div>
      )}

      {/* ফর্ম ও জমা মডাল */}
      <GoalFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setGoalToEdit(null);
        }}
        goalToEdit={goalToEdit}
      />

      <ContributeModal
        isOpen={isContribModalOpen}
        onClose={() => {
          setIsContribModalOpen(false);
          setGoalToContrib(null);
        }}
        goal={goalToContrib}
      />

      {/* ডিলিট কনফার্মেশন মডাল */}
      <ConfirmationModal
        isOpen={Boolean(goalToDelete)}
        onClose={() => setGoalToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteGoalMutation.isPending}
        title={`"${goalToDelete?.name || 'লক্ষ্য'}" মুছে ফেলবেন?`}
        description="আপনি কি নিশ্চিতভাবে এই লক্ষ্যটি মুছে ফেলতে চান? পূর্ববর্তী জমার লেনদেনসমূহ সুরক্ষিত থাকবে।"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
      />
    </div>
  );
};
