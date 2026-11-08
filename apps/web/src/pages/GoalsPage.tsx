import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Clock } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            হিসাবখাতা লক্ষ্য
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            সঞ্চয়ের লক্ষ্য
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ভবিষ্যৎ পরিকল্পনা ও সঞ্চয় জমার হিসাব
          </p>
        </div>
      </div>

      <Card className="border-border/60 text-center py-12 px-4">
        <CardContent className="space-y-4 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
            <Target className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-foreground">
              সঞ্চয়ের লক্ষ্য ট্র্যাকার (Phase 5)
            </h3>
            <p className="text-sm text-muted-foreground">
              নির্দিষ্ট সঞ্চয়ের লক্ষ্য তৈরি করা, জমার প্রগ্রেস বার ও স্বয়ংক্রিয় লেনদেন তৈরির ফিচার সংযুক্ত হবে।
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 py-1 px-3">
            <Clock className="h-3.5 w-3.5 text-blue-500" /> Phase 5-এ আসছে
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
