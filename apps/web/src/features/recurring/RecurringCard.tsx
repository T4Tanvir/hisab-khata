import React from 'react';
import type { RecurringRule } from '@hisab/shared';
import { formatBengaliDate, toBengaliDigits } from '@hisab/shared';
import { Money } from '@/components/Money';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Check, Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface RecurringCardProps {
  rule: RecurringRule;
  onPay: (rule: RecurringRule) => void;
  onEdit?: (rule: RecurringRule) => void;
  onDelete?: (rule: RecurringRule) => void;
  isPaying?: boolean;
}

export const RecurringCard: React.FC<RecurringCardProps> = ({
  rule,
  onPay,
  onEdit,
  onDelete,
  isPaying,
}) => {
  const isIncome = rule.type === 'income';

  return (
    <Card className="border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* বাম পাশে আইকন ও বিবরণ */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              isIncome ? 'bg-pos/10 text-pos' : 'bg-neg/10 text-neg'
            }`}
          >
            {isIncome ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
                {rule.note || rule.categoryName}
              </h4>
              <Badge variant="outline" className="text-[11px] font-normal">
                {rule.frequency === 'monthly'
                  ? `প্রতি মাসের ${toBengaliDigits(rule.dayOfMonth)} তারিখ`
                  : 'সাপ্তাহিক'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span>খাত: {rule.categoryName}</span>
              <span>·</span>
              <span>ওয়ালেট: {rule.walletName}</span>
              <span>·</span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <Calendar className="h-3 w-3" />
                পরবর্তী: {formatBengaliDate(rule.nextDueOn)}
              </span>
            </div>
          </div>
        </div>

        {/* ডান পাশে টাকার পরিমাণ ও অ্যাকশন বাটনসমূহ */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border/60">
          <Money
            amount={rule.amount}
            showSign
            type={rule.type}
            className="text-base sm:text-lg font-bold font-mono"
          />

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => onPay(rule)}
              disabled={isPaying}
              className="gap-1.5 h-8 text-xs font-semibold"
            >
              <Check className="h-3.5 w-3.5" />
              {isPaying ? 'প্রক্রিয়াকরণ...' : 'পরিশোধ করুন'}
            </Button>

            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(rule)}
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(rule)}
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
