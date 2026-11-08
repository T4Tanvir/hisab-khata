import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Clock } from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            হিসাবখাতা বাজেট
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            বাজেট ব্যবস্থাপনা
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            মাসিক খরচের খাত ও বাজেট সীমা পর্যবেক্ষণ
          </p>
        </div>
      </div>

      <Card className="border-border/60 text-center py-12 px-4">
        <CardContent className="space-y-4 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <PieChart className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-foreground">
              বাজেট ব্যবস্থাপনা ফিচার (Phase 4)
            </h3>
            <p className="text-sm text-muted-foreground">
              ক্যাটাগরিভিত্তিক বাজেট নির্ধারণ, প্রগ্রেস বার ট্র্যাকিং এবং খরচের সতর্কতা নোটিফিকেশন পরবর্তী আপডেটে চালু হবে।
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 py-1 px-3">
            <Clock className="h-3.5 w-3.5 text-primary" /> পরবর্তী ধাপে আসছে
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
