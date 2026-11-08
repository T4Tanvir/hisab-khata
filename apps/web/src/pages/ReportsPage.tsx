import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            হিসাবখাতা পরিসংখ্যান
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            রিপোর্ট ও চার্ট
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            মাসিক আয়-ব্যয় বিশ্লেষণ ও সঞ্চয় ট্রেন্ড
          </p>
        </div>
      </div>

      <Card className="border-border/60 text-center py-12 px-4">
        <CardContent className="space-y-4 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-pos/10 text-pos mx-auto flex items-center justify-center">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-foreground">
              বিশ্লেষণ ও রিপোর্ট (Phase 5)
            </h3>
            <p className="text-sm text-muted-foreground">
              গত ৬ মাসের আয়-ব্যয়ের তুলনা চার্ট, খাতভিত্তিক বিশ্লেষণ টেবিল এবং এক ক্লিকে CSV ডাউনলোড সুবিধা।
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 py-1 px-3">
            <Clock className="h-3.5 w-3.5 text-pos" /> Phase 5-এ আসছে
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
