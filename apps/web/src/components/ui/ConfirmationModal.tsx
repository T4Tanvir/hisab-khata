import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { AlertTriangle, AlertCircle, Trash2, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'default';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'destructive',
  isLoading = false,
  icon,
}) => {
  const { t } = useLanguage();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // মডাল খোলার সময় আগের ত্রুটি মুছে ফেলা
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIsConfirming(false);
    }
  }, [isOpen]);

  const defaultTitle = t.common.confirmDelete;
  const defaultConfirmText = variant === 'destructive' ? t.common.yesDelete : t.common.confirm;
  const defaultCancelText = t.common.cancel;

  const defaultIcon =
    variant === 'destructive' ? (
      <div className="h-11 w-11 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
        <Trash2 className="h-5 w-5" />
      </div>
    ) : variant === 'warning' ? (
      <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
        <AlertTriangle className="h-5 w-5" />
      </div>
    ) : (
      <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <HelpCircle className="h-5 w-5" />
      </div>
    );

  const busy = isLoading || isConfirming;

  const handleConfirm = async () => {
    setErrorMsg(null);
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (err: any) {
      // ব্যর্থ হলে মডালের ভেতরেই ত্রুটি দেখানো হবে (unhandled rejection নয়)
      setErrorMsg(err?.message || t.common.error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !busy && !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          {icon ?? defaultIcon}
          <div className="space-y-1.5 flex-1 min-w-0">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base sm:text-lg font-bold font-display text-foreground leading-tight">
                {title || defaultTitle}
              </DialogTitle>
              {description && (
                <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-0.5">
                  {description}
                </div>
              )}
            </DialogHeader>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <DialogFooter className="mt-4 pt-3 border-t border-border/50 flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={busy}
            className="w-full sm:w-auto h-9 text-xs sm:text-sm font-semibold"
          >
            {cancelText || defaultCancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            isLoading={busy}
            className="w-full sm:w-auto h-9 text-xs sm:text-sm font-semibold shadow-sm"
          >
            {confirmText || defaultConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
