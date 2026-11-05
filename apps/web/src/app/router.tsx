import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/features/auth/auth-client';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Protected Route wrapper
const ProtectedRoute: React.FC = () => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--ink)',
          fontSize: '1.1rem',
        }}
      >
        অপেক্ষা করুন...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
};

// Public Auth Route wrapper (redirects to / if already logged in)
const PublicAuthRoute: React.FC = () => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return null;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <AuthLayout />;
};

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/transactions', element: <TransactionsPage /> },
      { path: '/budgets', element: <BudgetsPage /> },
      { path: '/goals', element: <GoalsPage /> },
      { path: '/reports', element: <ReportsPage /> },
      { path: '/accounts', element: <AccountsPage /> },
    ],
  },
  {
    element: <PublicAuthRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

