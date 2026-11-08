import React from 'react';
import type { Wallet } from '@hisab/shared';
import { Money } from '@/components/Money';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Wallet as WalletIcon, Building2, Smartphone, CreditCard } from 'lucide-react';

interface WalletCardProps {
  wallet: Wallet;
  onDelete?: (id: string) => void;
}

const WALLET_TYPE_LABELS: Record<string, string> = {
  cash: 'নগদ টাকা',
  bank: 'ব্যাংক হিসাব',
  mobile: 'মোবাইল ব্যাংকিং',
  card: 'কার্ড',
};

const getWalletIcon = (type: string) => {
  switch (type) {
    case 'cash':
      return <WalletIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    case 'bank':
      return <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    case 'mobile':
      return <Smartphone className="h-5 w-5 text-pink-600 dark:text-pink-400" />;
    case 'card':
      return <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    default:
      return <WalletIcon className="h-5 w-5 text-muted-foreground" />;
  }
};

export const WalletCard: React.FC<WalletCardProps> = ({ wallet, onDelete }) => {
  const typeLabel = WALLET_TYPE_LABELS[wallet.type] || 'অন্যান্য';

  return (
    <Card className="hover:border-primary/40 transition-colors shadow-sm">
      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-secondary/70 flex items-center justify-center">
              {getWalletIcon(wallet.type)}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {typeLabel}
              </p>
              <h3 className="text-lg font-bold font-display text-foreground leading-tight">
                {wallet.name}
              </h3>
            </div>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(wallet.id)}
              title="মুছে ফেলুন"
              className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-secondary/60 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div>
          <p className="text-2xl font-bold font-display text-foreground tracking-tight">
            <Money amount={wallet.currentBalance} />
          </p>
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>প্রারম্ভিক ব্যালেন্স</span>
          <span className="font-semibold text-foreground">
            <Money amount={wallet.openingBalance} />
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
