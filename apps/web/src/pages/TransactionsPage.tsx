import React from 'react';

export const TransactionsPage: React.FC = () => {
  return (
    <div className="wrap">
      <header className="head">
        <div>
          <p className="eyebrow">হিসাবখাতা</p>
          <h1>লেনদেন</h1>
          <p className="sub">সব লেনদেনের তালিকা ও লেজার</p>
        </div>
      </header>
      <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>
          লেনদেনের পূর্ণ তালিকা, ফিল্টার ও এডিট ফর্ম Phase 3-এ চালু হবে।
        </p>
      </div>
    </div>
  );
};

