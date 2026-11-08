import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/60 text-center py-10 px-6 shadow-md">
        <CardContent className="space-y-5">
          <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-inner">
            <FileQuestion className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold font-display text-primary tracking-tight">
              ৪০৪
            </h1>
            <h2 className="text-lg font-bold text-foreground">
              পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              আপনি যে লিঙ্কটিতে প্রবেশ করতে চেয়েছেন তা হয়তো সরানো হয়েছে অথবা ভুল ইউআরএল দেওয়া হয়েছে।
            </p>
          </div>

          <Link to="/" className="inline-block pt-2">
            <Button className="gap-2 shadow-sm font-semibold">
              <Home className="h-4 w-4" />
              ড্যাশবোর্ডে ফিরে যান
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
