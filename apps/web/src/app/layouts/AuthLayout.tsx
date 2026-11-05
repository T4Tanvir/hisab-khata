import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--line-strong)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow)',
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: 'var(--f-display)',
              fontSize: '2rem',
              color: 'var(--accent)',
              margin: '0 0 0.5rem 0',
            }}
          >
            হিসাবখাতা
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: 0 }}>
            পরিবারের আয়-ব্যয়ের খাতা
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

