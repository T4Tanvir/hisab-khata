import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useSession } from '@/features/auth/auth-client';
import { formatBengaliMonth, getDhakaMonth } from '@hisab/shared';

export const DashboardPage: React.FC = () => {
  const { data: session } = useSession();
  const currentMonth = getDhakaMonth();

  const { data: health, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<{ status: string; service: string; time: string }>('/health'),
  });

  return (
    <div className="wrap">
      <header className="head">
        <div>
          <p className="eyebrow">স্বাগতম, {session?.user?.name || 'ব্যবহারকারী'}</p>
          <h1>ড্যাশবোর্ড</h1>
          <p className="sub">{formatBengaliMonth(currentMonth)}</p>
        </div>
        <div className="head-r">
          <span className="month-tag">
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
            {formatBengaliMonth(currentMonth)}
          </span>
        </div>
      </header>

      <div className="dash" style={{ display: 'grid', gap: '1.5rem' }}>
        {/* API Health Status Banner */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Backend API সংযোগ</h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
              Hono সার্ভার (/api/health) প্রক্সি স্ট্যাটাস
            </p>
          </div>
          <div>
            {isLoading ? (
              <span className="chip sm" style={{ background: 'var(--warn)', color: '#000' }}>
                চেক করা হচ্ছে...
              </span>
            ) : error ? (
              <span className="chip sm" style={{ background: 'var(--crit)', color: '#fff' }}>
                সংযোগ বিচ্ছিন্ন
              </span>
            ) : (
              <span className="chip sm" style={{ background: 'var(--good)', color: '#fff' }}>
                API: {health?.status?.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Phase Progress Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            padding: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--accent)' }}>
            হিসাবখাতা Phase 0 ও Phase 1 প্রস্তুত
          </h2>
          <p style={{ lineHeight: '1.6', color: 'var(--ink-2)' }}>
            মনোরিপো আর্কিটেকচার, Better Auth ইন্টিগ্রেশন, Drizzle ORM ডেটাবেজ স্কিমা (wallets, categories, transactions, budgets, goals, recurring_rules), এবং ডেমোর লাল খাতা ডিজাইনের লেআউট সফলভাবে তৈরি হয়েছে।
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="chip sm" style={{ background: 'var(--c1)', color: '#fff' }}>React + Vite</span>
            <span className="chip sm" style={{ background: 'var(--c2)', color: '#fff' }}>Hono API</span>
            <span className="chip sm" style={{ background: 'var(--c3)', color: '#fff' }}>Better Auth</span>
            <span className="chip sm" style={{ background: 'var(--c4)', color: '#000' }}>Drizzle ORM</span>
            <span className="chip sm" style={{ background: 'var(--c5)', color: '#fff' }}>Neon Postgres</span>
          </div>
        </div>
      </div>
    </div>
  );
};

