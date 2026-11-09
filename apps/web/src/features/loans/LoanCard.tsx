import React from 'react';
import type { Loan } from '@hisab/shared';
import { toBengaliDigits } from '@hisab/shared';
import { useLanguage } from '@/hooks/useLanguage';
import { Money } from '@/components/Money';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Trash2,
  PlusCircle,
  Eye,
} from 'lucide-react';

interface LoanCardProps {
  loan: Loan;
  onPayment: (loan: Loan) => void;
  onViewDetails: (loan: Loan) => void;
  onEdit: (loan: Loan) => void;
  onDelete: (loan: Loan) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onPayment,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const { language, t, formatDateStr } = useLanguage();
  const isBorrowed = loan.direction === 'borrowed';
  const isSettled = loan.status === 'settled';
  const remaining = BigInt(loan.remaining);

  return (
    <Card className="border-border/60 hover:shadow-md transition-shadow relative overflow-hidden bg-card">
      {/* বাম পাশের রঙের বর্ডার স্ট্রিপ */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1.5 ${
          isSettled
            ? 'bg-pos'
            : isBorrowed
            ? 'bg-destructive'
            : 'bg-emerald-600'
        }`}
      />

      <CardContent className="p-4 sm:p-5 pl-5 sm:pl-6 space-y-4">
        {/* হেডার: টাইপ, নাম, ফোন ও স্ট্যাটাস */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[11px] font-semibold gap-1 py-0.5 px-2 ${
                  isBorrowed
                    ? 'border-destructive/30 text-destructive bg-destructive/10'
                    : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                }`}
              >
                {isBorrowed ? (
                  <ArrowDownLeft className="h-3 w-3" />
                ) : (
                  <ArrowUpRight className="h-3 w-3" />
                )}
                {isBorrowed ? t.loans.borrowed : t.loans.lent}
              </Badge>

              {isSettled ? (
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium border-pos/30 text-pos bg-pos/10 gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {t.loans.settled}
                </Badge>
              ) : loan.isOverdue ? (
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium border-destructive/40 text-destructive bg-destructive/15 gap-1 animate-pulse"
                >
                  <AlertCircle className="h-3 w-3" />
                  {t.loans.overdue}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[11px] font-medium">
                  {t.loans.active}
                </Badge>
              )}
            </div>

            <h3 className="font-bold text-base sm:text-lg text-foreground truncate mt-1">
              {loan.personName}
            </h3>

            {loan.personPhone && (
              <a
                href={`tel:${loan.personPhone}`}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                title={loan.personPhone}
              >
                <Phone className="h-3 w-3" />
                <span>{loan.personPhone}</span>
              </a>
            )}
          </div>

          {/* অ্যাকশন বাটনসমূহ (এডিট ও ডিলিট) */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(loan)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title={t.common.edit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(loan)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title={t.common.delete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* বাকি ও পরিশোধ পরিসংখ্যান */}
        <div className="bg-muted/40 rounded-xl p-3 border border-border/50 grid grid-cols-2 gap-2">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">
              {t.loans.remaining}
            </p>
            <p className="font-display text-lg sm:text-xl font-bold text-foreground">
              <Money amount={loan.remaining} />
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground font-medium">
              {t.loans.principal}
            </p>
            <p className="text-sm font-semibold text-muted-foreground">
              <Money amount={loan.principal} />
            </p>
          </div>
        </div>

        {/* প্রগ্রেস বার */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t.loans.totalPaid}: <Money amount={loan.totalPaid} />
            </span>
            <span className="font-semibold text-foreground">
              {language === 'bn'
                ? `${toBengaliDigits(loan.percentage)}%`
                : `${loan.percentage}%`}
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isSettled
                  ? 'bg-pos'
                  : isBorrowed
                  ? 'bg-destructive'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${loan.percentage}%` }}
            />
          </div>
        </div>

        {/* তারিখ ও নোট */}
        <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {t.loans.startedOn}: {formatDateStr(loan.startedOn)}
            </span>
            {loan.dueOn && (
              <span
                className={`flex items-center gap-1 ${
                  loan.isOverdue ? 'text-destructive font-semibold' : ''
                }`}
              >
                {t.loans.dueOn}: {formatDateStr(loan.dueOn)}
              </span>
            )}
          </div>
          {loan.note && (
            <p className="text-[11px] text-muted-foreground/90 italic truncate">
              "{loan.note}"
            </p>
          )}
        </div>

        {/* মূল বাটনসমূহ: পরিশোধ/আদায় এবং বিস্তারিত */}
        <div className="flex items-center gap-2 pt-1">
          {remaining > 0n && (
            <Button
              size="sm"
              onClick={() => onPayment(loan)}
              className="flex-1 gap-1.5 text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              {isBorrowed ? t.loans.makePayment : t.loans.recordPayment}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(loan)}
            className={`gap-1.5 text-xs font-medium border-border/70 ${
              remaining === 0n ? 'w-full' : ''
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            {t.loans.paymentHistory}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
