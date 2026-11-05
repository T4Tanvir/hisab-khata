import React from 'react';

export const AccountsPage: React.FC = () => {
  return (
    <div className="wrap">
      <header className="head">
        <div>
          <p className="eyebrow">হিসাবখাতা</p>
          <h1>অ্যাকাউন্ট ও ওয়ালেট</h1>
          <p className="sub">নগদ, ব্যাংক ও মোবাইল ওয়ালেটের ব্যালেন্স</p>
        </div>
      </header>
      <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>
          ওয়ালেট যোগ ও ব্যালেন্স হিসাব Phase 2-এ যুক্ত হবে।
        </p>
      </div>
    </div>
  );
};

