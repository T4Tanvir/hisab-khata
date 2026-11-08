import React, { useState, useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut, useSession } from '@/features/auth/auth-client';
import { TransactionFormModal } from '@/features/transactions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import {
  BookMarked,
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  BarChart3,
  Wallet,
  Plus,
  LogOut,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const navItems = useMemo(
    () => [
      { to: '/', label: t.nav.dashboard, icon: LayoutDashboard, exact: true },
      { to: '/transactions', label: t.nav.transactions, icon: Receipt },
      { to: '/budgets', label: t.nav.budgets, icon: PieChart },
      { to: '/goals', label: t.nav.goals, icon: Target },
      { to: '/reports', label: t.nav.reports, icon: BarChart3 },
      { to: '/accounts', label: t.nav.accounts, icon: Wallet },
    ],
    [t]
  );

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* ডেস্কটপ সাইডবার */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border/70 bg-card z-30">
        {/* ব্র্যান্ড লোগো ও নাম */}
        <div className="p-5 border-b border-border/60 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm border border-primary/20">
            <BookMarked className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg leading-tight text-foreground tracking-tight">
              {t.common.appName}
            </h2>
            <p className="text-[11px] text-muted-foreground font-medium">
              {t.common.subtitle}
            </p>
          </div>
        </div>

        {/* নতুন লেনদেন বাটন */}
        <div className="p-4">
          <Button
            onClick={() => setIsTxModalOpen(true)}
            className="w-full justify-center gap-2 h-10 shadow-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            {t.transactions.newTransaction}
          </Button>
        </div>

        {/* প্রধান মেনু লিঙ্কসমূহ */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-bold shadow-xs'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ইউজার তথ্য ও লগআউট */}
        <div className="p-4 border-t border-border/60 bg-muted/20">
          <div className="flex items-center justify-between mb-3 px-1 gap-1">
            <div className="min-w-0 pr-1 flex-1">
              <p className="text-xs font-bold text-foreground truncate">
                {session?.user?.name || (language === 'bn' ? 'ব্যবহারকারী' : 'User')}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {session?.user?.email || ''}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="h-8 px-2 rounded-lg text-xs font-bold gap-1 text-muted-foreground hover:text-foreground"
                title={t.common.switchLanguage}
              >
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span>{language === 'bn' ? 'বাং' : 'EN'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                title={theme === 'dark' ? t.common.lightMode : t.common.darkMode}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-center gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-border/70"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t.nav.logout}
          </Button>
        </div>
      </aside>

      {/* মোবাইলের উপরের বার */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-border/70 bg-card/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <BookMarked className="h-4 w-4" />
          </div>
          <div>
            <span className="font-display font-bold text-base text-foreground leading-none">
              {t.common.appName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="h-8 px-2 rounded-lg text-xs font-bold gap-1 text-muted-foreground hover:text-foreground"
            title={t.common.switchLanguage}
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{language === 'bn' ? 'বাং' : 'EN'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
            title={theme === 'dark' ? t.common.lightMode : t.common.darkMode}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
            title={t.nav.logout}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* মূল কন্টেন্ট */}
      <main className="flex-1 md:pl-64 min-w-0">
        <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24 md:pb-8 min-w-0">
          <Outlet />
        </div>
      </main>

      {/* মোবাইলের ভাসমান "+" বাটন */}
      <button
        type="button"
        onClick={() => setIsTxModalOpen(true)}
        className="md:hidden fixed right-4 bottom-20 z-40 h-12 w-12 sm:h-13 sm:w-13 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label={t.transactions.newTransaction}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* মোবাইলের নিচের ট্যাব মেনু */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border/70 bg-card/95 backdrop-blur-md flex items-center justify-around px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[10px] font-medium transition-colors min-w-0',
                isActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-full text-center px-0.5">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* নতুন লেনদেন মডাল */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
      />
    </div>
  );
};
