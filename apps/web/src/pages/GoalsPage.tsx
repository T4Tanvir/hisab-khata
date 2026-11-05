import React from 'react';

export const GoalsPage: React.FC = () => {
  return (
    <div className="wrap">
      <header className="head">
        <div>
          <p className="eyebrow">হিসাবখাতা</p>
          <h1>সঞ্চয়ের লক্ষ্য</h1>
          <p className="sub">ভবিষ্যত পরিকল্পনা ও জমার হিসাব</p>
        </div>
      </header>
      <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>
          লক্ষ্য তৈরি ও জমার ট্র্যাকিং Phase 5-এ চালু হবে।
        </p>
      </div>
    </div>
  );
};

