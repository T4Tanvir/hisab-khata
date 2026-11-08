import React from 'react';
import { Outlet } from 'react-router-dom';
import { Card } from '@/components/ui/card';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-[420px] p-6 sm:p-8 shadow-xl border-border bg-card">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-display text-2xl font-bold mb-3 shadow-md">
            হি
          </div>
          <h1 className="font-display text-3xl font-bold text-primary tracking-tight">
            হিসাবখাতা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            পরিবারের আয়-ব্যয়ের খাতা
          </p>
        </div>
        <Outlet />
      </Card>
    </div>
  );
};
