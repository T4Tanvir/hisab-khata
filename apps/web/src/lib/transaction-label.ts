import type { Transaction } from '@hisab/shared';
import type { TranslationSchema } from '@/i18n/translations';
import { interpolate } from '@/i18n/interpolate';

type LabelSource = Pick<Transaction, 'type' | 'note' | 'loanPersonName' | 'loanDirection' | 'goalName'>;

/**
 * Title for loan and saving rows, in the current language.
 * A note the user typed always wins; otherwise the label is built from the
 * loan person / goal name (the server no longer stores auto-generated text).
 */
export function loanOrSavingLabel(tx: LabelSource, t: TranslationSchema): string {
  if (tx.note) return tx.note;

  if (tx.type === 'saving') {
    return tx.goalName ? interpolate(t.transactions.savedToGoal, { name: tx.goalName }) : t.transactions.savingLabel;
  }

  const isIn = tx.type === 'loan_in';
  const name = tx.loanPersonName;
  if (name && tx.loanDirection) {
    const template =
      tx.loanDirection === 'borrowed'
        ? isIn ? t.transactions.loanBorrowedFrom : t.transactions.loanRepaidTo
        : isIn ? t.transactions.loanCollectedFrom : t.transactions.loanLentTo;
    return interpolate(template, { name });
  }
  return isIn ? t.transactions.loanInLabel : t.transactions.loanOutLabel;
}
