import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut, useSession } from '@/features/auth/auth-client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export const AppLayout: React.FC = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app">
      {/* ডেস্কটপ সাইডবার: লাল খাতার মলাট */}
      <aside class="cover" aria-label="প্রধান মেনু">
        <NavLink to="/" className="brand">
          <b>হিসাবখাতা</b>
          <span>পরিবারের আয়-ব্যয়ের খাতা</span>
        </NavLink>

        <button
          className="add"
          style={{ width: '100%', cursor: 'pointer', textAlign: 'left', border: 'none' }}
          onClick={() => setIsTxModalOpen(true)}
        >
          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          নতুন লেনদেন
        </button>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="7" height="9" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
            ড্যাশবোর্ড
          </NavLink>

          <NavLink to="/transactions" className={({ isActive }) => (isActive ? 'active' : '')}>
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6h12M9 12h12M9 18h12" />
              <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="2.6" />
            </svg>
            লেনদেন
          </NavLink>

          <NavLink to="/budgets" className={({ isActive }) => (isActive ? 'active' : '')}>
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 12A9 9 0 1 1 12 3v9z" />
              <path d="M15.5 3.7A9 9 0 0 1 20.3 8.5H15.5z" />
            </svg>
            বাজেট
          </NavLink>

          <NavLink to="/goals" className={({ isActive }) => (isActive ? 'active' : '')}>
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="1.2" />
            </svg>
            সঞ্চয়ের লক্ষ্য
          </NavLink>

          <NavLink to="/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 20V11M11 20V5M17 20v-6M3 20h18" />
            </svg>
            রিপোর্ট
          </NavLink>

          <NavLink to="/accounts" className={({ isActive }) => (isActive ? 'active' : '')}>
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7.5V6a2 2 0 0 1 2-2h11v3.5" />
              <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
              <path d="M16 14h2" />
            </svg>
            অ্যাকাউন্ট
          </NavLink>
        </nav>

        <div className="cover-foot" style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
          {session?.user && (
            <div style={{ marginBottom: '1rem', color: 'var(--cover-ink)' }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{session.user.name}</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>{session.user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--cover-ink)',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              width: '100%',
            }}
          >
            লগআউট করুন
          </button>
        </div>
      </aside>

      {/* মোবাইলের উপরের বার */}
      <header className="mtop">
        <NavLink to="/" className="brand">
          <b>হিসাবখাতা</b>
          <span>পরিবারের আয়-ব্যয়ের খাতা</span>
        </NavLink>
      </header>

      {/* মূল কন্টেন্ট */}
      <main id="main" className="main">
        <Outlet />
      </main>

      {/* মোবাইলের নিচের ট্যাব */}
      <nav className="tabbar" aria-label="প্রধান মেনু">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
          <span>হোম</span>
        </NavLink>

        <NavLink to="/transactions" className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6h12M9 12h12M9 18h12" />
            <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="2.6" />
          </svg>
          <span>লেনদেন</span>
        </NavLink>

        <NavLink to="/budgets" className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12A9 9 0 1 1 12 3v9z" />
            <path d="M15.5 3.7A9 9 0 0 1 20.3 8.5H15.5z" />
          </svg>
          <span>বাজেট</span>
        </NavLink>

        <NavLink to="/goals" className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1.2" />
          </svg>
          <span>লক্ষ্য</span>
        </NavLink>

        <NavLink to="/accounts" className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7.5V6a2 2 0 0 1 2-2h11v3.5" />
            <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
            <path d="M16 14h2" />
          </svg>
          <span>অ্যাকাউন্ট</span>
        </NavLink>
      </nav>

      {/* মোবাইলের ভাসমান "+" বাটন */}
      <button
        className="fab"
        aria-label="নতুন লেনদেন যোগ করুন"
        onClick={() => setIsTxModalOpen(true)}
      >
        <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* নতুন লেনদেন মডাল */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title="নতুন লেনদেন যোগ করুন"
      >
        <p style={{ padding: '1rem 0' }}>
          লেনদেনের সম্পূর্ণ ফর্মটি Phase 3-এ যুক্ত করা হবে।
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={() => setIsTxModalOpen(false)}>
            বন্ধ করুন
          </Button>
        </div>
      </Modal>
    </div>
  );
};

