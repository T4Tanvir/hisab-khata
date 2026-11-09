import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion, Home } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export const NotFoundPage: React.FC = () => {
  const { t, formatNumber } = useLanguage();
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/60 text-center py-10 px-6 shadow-md">
        <CardContent className="space-y-5">
          <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-inner">
            <FileQuestion className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold font-display text-primary tracking-tight">
              {formatNumber(404)}
            </h1>
            <h2 className="text-lg font-bold text-foreground">
              {t.notFound.heading}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t.notFound.message}
            </p>
          </div>

          <Link to="/" className="inline-block pt-2">
            <Button className="gap-2 shadow-sm font-semibold">
              <Home className="h-4 w-4" />
              {t.notFound.backHome}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
