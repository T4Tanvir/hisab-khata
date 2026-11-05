import React from 'react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="wrap">
      <header className="head">
        <div>
          <p className="eyebrow">হিসাবখাতা</p>
          <h1>রিপোর্ট ও চার্ট</h1>
          <p className="sub">আয়-ব্যয় বিশ্লেষণ ও সঞ্চয় ট্রেন্ড</p>
        </div>
      </header>
      <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>
          মাসিক ট্রেন্ড চার্ট ও CSV এক্সপোর্ট Phase 5-এ চালু হবে।
        </p>
      </div>
    </div>
  );
};

