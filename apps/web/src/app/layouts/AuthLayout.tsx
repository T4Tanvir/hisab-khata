import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const queryClient = useQueryClient();
  const { t, toggleLanguage } = useLanguage();

  // Login/Signup are only shown when nobody is signed in: drop any cached data
  // from the previous user here. No data queries are mounted on these pages, so
  // clearing cannot trigger refetches (which would 401 after sign-out).
  useEffect(() => {
    queryClient.clear();
  }, [queryClient]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      {/* Language can be switched before signing in */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="absolute top-3 right-3 h-8 px-2 rounded-lg text-xs font-bold gap-1 text-muted-foreground hover:text-foreground"
        title={t.common.switchLanguage}
      >
        <Globe className="h-3.5 w-3.5 text-primary" />
        <span>{t.common.language}</span>
      </Button>
      <Card className="w-full max-w-[420px] p-6 sm:p-8 shadow-xl border-border bg-card">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-display text-2xl font-bold mb-3 shadow-md">
            {t.auth.brandInitial}
          </div>
          <h1 className="font-display text-3xl font-bold text-primary tracking-tight">
            {t.common.appName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t.common.subtitle}
          </p>
        </div>
        <Outlet />
      </Card>
    </div>
  );
};
