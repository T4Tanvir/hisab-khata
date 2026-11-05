import React from 'react';

export const BudgetsPage: React.FC = () => {
  return (
    <div className="wrap">
      <header className="head">
        <div>
          <p className="eyebrow">হিসাবখাতা</p>
          <h1>বাজেট</h1>
          <p className="sub">মাসিক খরচের খাত ও সীমা</p>
        </div>
      </header>
      <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>
          বাজেট নির্ধারণ ও সীমা পর্যবেক্ষণ Phase 4-এ যুক্ত হবে।
        </p>
      </div>
    </div>
  );
};

