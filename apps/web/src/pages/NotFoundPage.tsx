import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="wrap" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '3rem', color: 'var(--accent)', marginBottom: '1rem' }}>৪০৪</h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--muted)', marginBottom: '2rem' }}>
        পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
      </p>
      <Link to="/">
        <Button>হোমে ফিরে যান</Button>
      </Link>
    </div>
  );
};

