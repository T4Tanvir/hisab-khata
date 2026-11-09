import React, { useEffect, useState } from 'react';
import type { RecurringRule } from '@hisab/shared';
import { useRecurringRules, useDeleteRecurringRule, useRecurringPayAction } from './hooks';
import { RecurringCard } from './RecurringCard';
import { RecurringFormModal } from './RecurringFormModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useLanguage } from '@/hooks/useLanguage';
import { AlertCircle, Plus } from 'lucide-react';

interface RecurringManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Lists ALL recurring rules (active and paused) with pay / edit / delete actions. */
export const RecurringManageModal: React.FC<RecurringManageModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { data: rules, isLoading } = useRecurringRules();
  const deleteMutation = useDeleteRecurringRule();
  const { pay, payingId, payError, clearPayError } = useRecurringPayAction();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<RecurringRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<RecurringRule | null>(null);

  // Clear a stale payment error each time the modal is reopened
  useEffect(() => {
    if (isOpen) clearPayError();
  }, [isOpen, clearPayError]);

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;
    // Errors are caught and shown inside the ConfirmationModal
    await deleteMutation.mutateAsync(ruleToDelete.id);
    setRuleToDelete(null);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={t.recurring.manageTitle}>
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRuleToEdit(null);
                setIsFormOpen(true);
              }}
              className="gap-1.5 h-8 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" /> {t.recurring.newBill}
            </Button>
          </div>

          {payError && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{payError.message}</span>
            </div>
          )}

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">{t.common.loading}</div>
            ) : !rules || rules.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl border border-dashed bg-muted/20 text-xs text-muted-foreground">
                {t.recurring.noRules}
              </div>
            ) : (
              rules.map((rule) => (
                <RecurringCard
                  key={rule.id}
                  rule={rule}
                  onPay={rule.active === false ? undefined : (r) => void pay(r, t.recurring.payError)}
                  isPaying={payingId === rule.id}
                  payDisabled={payingId !== null}
                  onEdit={(r) => {
                    setRuleToEdit(r);
                    setIsFormOpen(true);
                  }}
                  onDelete={(r) => setRuleToDelete(r)}
                />
              ))
            )}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">
              {t.common.close}
            </Button>
          </div>
        </div>
      </Modal>

      <RecurringFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setRuleToEdit(null);
        }}
        ruleToEdit={ruleToEdit}
      />

      <ConfirmationModal
        isOpen={Boolean(ruleToDelete)}
        onClose={() => setRuleToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title={t.recurring.deleteTitle}
        description={t.recurring.deleteMessage}
        confirmText={t.common.yesDelete}
        cancelText={t.common.cancel}
      />
    </>
  );
};
