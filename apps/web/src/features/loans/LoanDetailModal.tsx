import React from 'react';
import type { Loan } from '@hisab/shared';
import { useLoan } from './hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { Money } from '@/components/Money';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Wallet,
} from 'lucide-react';

interface LoanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onOpenPayment?: (loan: Loan) => void;
}

export const LoanDetailModal: React.FC<LoanDetailModalProps> = ({
  isOpen,
  onClose,
  loan,
  onOpenPayment,
}) => {
  const { t, formatDateStr } = useLanguage();
  const { data: detailedLoan, isLoading } = useLoan(loan?.id || '');

  if (!loan) return null;

  const current = detailedLoan || loan;
  const isBorrowed = current.direction === 'borrowed';
  const isSettled = current.status === 'settled';
  const remaining = BigInt(current.remaining);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${current.personName} — ${isBorrowed ? 'দেনার বিবরণ' : 'পাওনার বিবরণ'}`}
    >
      <div className="space-y-5 pt-1">
        {/* উপরের সামারি কার্ড */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs font-semibold gap-1 py-1 px-2.5 ${
                  isBorrowed
                    ? 'border-destructive/30 text-destructive bg-destructive/10'
                    : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                }`}
              >
                {isBorrowed ? (
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                )}
                {isBorrowed ? t.loans.borrowed : t.loans.lent}
              </Badge>

              {isSettled ? (
                <Badge
                  variant="outline"
                  className="text-xs font-medium border-pos/30 text-pos bg-pos/10 gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t.loans.settled}
                </Badge>
              ) : current.isOverdue ? (
                <Badge
                  variant="outline"
                  className="text-xs font-medium border-destructive/40 text-destructive bg-destructive/15 gap-1"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {t.loans.overdue}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs font-medium">
                  {t.loans.active}
                </Badge>
              )}
            </div>

            {current.personPhone && (
              <a
                href={`tel:${current.personPhone}`}
                className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                {current.personPhone}
              </a>
            )}
          </div>

          {/* টাকার ৩টি মূল পরিসংখ্যান */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50 text-center sm:text-left">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">
                {t.loans.principal}
              </p>
              <p className="text-sm sm:text-base font-bold text-foreground">
                <Money amount={current.principal} />
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">
                {t.loans.totalPaid}
              </p>
              <p className="text-sm sm:text-base font-bold text-pos">
                <Money amount={current.totalPaid} />
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">
                {t.loans.remaining}
              </p>
              <p
                className={`text-sm sm:text-base font-bold ${
                  remaining > 0n ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                <Money amount={current.remaining} />
              </p>
            </div>
          </div>

          {/* তারিখ ও নোট */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {t.loans.startedOn}: {formatDateStr(current.startedOn)}
            </span>
            {current.dueOn && (
              <span
                className={`flex items-center gap-1 ${
                  current.isOverdue ? 'text-destructive font-semibold' : ''
                }`}
              >
                {t.loans.dueOn}: {formatDateStr(current.dueOn)}
              </span>
            )}
          </div>

          {current.note && (
            <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-1">
              নোট: "{current.note}"
            </p>
          )}
        </div>

        {/* পরিশোধ ও লেনদেনের ইতিহাস তালিকা */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              {t.loans.paymentHistory}
            </h4>
            {remaining > 0n && onOpenPayment && (
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenPayment(current);
                }}
                className="h-8 text-xs font-semibold shadow-xs"
              >
                {isBorrowed ? t.loans.makePayment : t.loans.recordPayment}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {t.common.loading}
            </div>
          ) : !current.transactions || current.transactions.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border/60">
              এখনও কোনো লেনদেন রেকর্ড করা হয়নি।
            </div>
          ) : (
            <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/50 bg-card">
              {current.transactions.map((tx) => {
                const isMoneyIn = tx.type === 'loan_in';
                return (
                  <div
                    key={tx.id}
                    className="p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {tx.note ||
                            (tx.type === 'loan_in' ? 'টাকা ঢুকল' : 'টাকা বের হলো')}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 text-muted-foreground"
                        >
                          <Wallet className="h-2.5 w-2.5 mr-1" />
                          {tx.walletName || 'ওয়ালেট'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDateStr(tx.occurredOn)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`font-semibold font-display text-sm ${
                          isMoneyIn ? 'text-pos' : 'text-destructive'
                        }`}
                      >
                        {isMoneyIn ? '+' : '-'} <Money amount={tx.amount} />
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ফুটার */}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-border/70 text-xs"
          >
            {t.common.close}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
