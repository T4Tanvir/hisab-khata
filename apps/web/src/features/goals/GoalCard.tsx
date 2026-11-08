import React from 'react';
import type { Goal } from '@hisab/shared';
import { toBengaliDigits } from '@hisab/shared';
import { useLanguage } from '@/hooks/useLanguage';
import { Money } from '@/components/Money';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Pencil, Trash2, Plus, Calendar, CheckCircle2 } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onContribute: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onContribute,
}) => {
  const { formatMonthStr } = useLanguage();
  const target = BigInt(goal.targetAmount);
  const current = BigInt(goal.currentAmount);
  const remaining = target > current ? target - current : 0n;
  const isCompleted = goal.percentage >= 100;

  return (
    <Card className="border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* উপরের সারি: আইকন, নাম, ডেট ও অ্যাকশন */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                isCompleted
                  ? 'bg-pos/10 text-pos'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Target className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 space-y-0.5">
              <h4 className="font-bold text-base text-foreground truncate">
                {goal.name}
              </h4>
              {goal.dueMonth && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  টার্গেট: {formatMonthStr(goal.dueMonth)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(goal)}
              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              title="সম্পাদনা করুন"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(goal)}
              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="মুছে ফেলুন"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* নোট */}
        {goal.note && (
          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
            {goal.note}
          </p>
        )}

        {/* প্রগ্রেস বার */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">অগ্রগতি</span>
            <span className="font-bold font-mono text-foreground">
              {toBengaliDigits(goal.percentage)}%
            </span>
          </div>

          <div className="w-full bg-muted/60 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-pos' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(goal.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* টাকার হিসাব গ্রিড */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">টার্গেট</span>
            <span className="font-semibold font-mono text-foreground text-xs sm:text-sm">
              <Money amount={goal.targetAmount} />
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px]">জমা হয়েছে</span>
            <span className="font-semibold font-mono text-pos text-xs sm:text-sm">
              <Money amount={goal.currentAmount} />
            </span>
          </div>

          <div className="text-right">
            <span className="text-muted-foreground block text-[11px]">বাকি আছে</span>
            <span className="font-semibold font-mono text-foreground text-xs sm:text-sm">
              <Money amount={remaining.toString()} />
            </span>
          </div>
        </div>

        {/* টাকা জমা দিন বাটন */}
        <Button
          onClick={() => onContribute(goal)}
          variant={isCompleted ? 'outline' : 'default'}
          className="w-full gap-1.5 h-9 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          টাকা জমা দিন
        </Button>
      </CardContent>
    </Card>
  );
};
