import React from 'react';
import type { Wallet } from '@hisab/shared';
import { Money } from '@/components/Money';
import { Trash2 } from 'lucide-react';

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

export const WalletCard: React.FC<WalletCardProps> = ({ wallet, onDelete }) => {
  const typeLabel = WALLET_TYPE_LABELS[wallet.type] || 'অন্যান্য';

  return (
    <article className="panel card" style={{ position: 'relative' }}>
      <div className="card-top">
        <span className="chip tr" aria-hidden="true">
          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7.5V6a2 2 0 0 1 2-2h11v3.5" />
            <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
            <path d="M16 14h2" />
          </svg>
        </span>
        <div style={{ flex: 1 }}>
          <p className="eyebrow">{typeLabel}</p>
          <h2>{wallet.name}</h2>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(wallet.id)}
            title="মুছে ফেলুন"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              padding: '4px',
            }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <p className="bigv num">
        <Money amount={wallet.currentBalance} />
      </p>

      <div className="foot">
        <span>
          প্রারম্ভিক ব্যালেন্স: <b className="num"><Money amount={wallet.openingBalance} /></b>
        </span>
      </div>
    </article>
  );
};
