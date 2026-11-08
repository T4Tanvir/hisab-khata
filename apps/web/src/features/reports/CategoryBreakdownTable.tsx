import React from 'react';
import type { CategoryComparison } from './api';
import { toBengaliDigits } from '@hisab/shared';
import { Money } from '@/components/Money';
import { CategoryChip } from '@/components/CategoryChip';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface CategoryBreakdownTableProps {
  categories: CategoryComparison[];
  isLoading?: boolean;
}

export const CategoryBreakdownTable: React.FC<CategoryBreakdownTableProps> = ({
  categories,
  isLoading,
}) => {
  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg font-bold font-display">
          খাতভিত্তিক বিস্তারিত ব্যয় ও পূর্ববর্তী মাসের তুলনা
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          গত মাসের সাথে খরচের হ্রাস-বৃদ্ধির খতিয়ান
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            লোড হচ্ছে...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            কোনো খরচের ডেটা পাওয়া যায়নি
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-xs sm:text-sm text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] font-semibold border-y border-border/60">
                <tr>
                  <th className="py-3 px-4">খাত / বিবরণ</th>
                  <th className="py-3 px-3 text-center">লেনদেন সংখ্যা</th>
                  <th className="py-3 px-4 text-right">চলতি মাসের খরচ</th>
                  <th className="py-3 px-4 text-right">আগের মাসের খরচ</th>
                  <th className="py-3 px-4 text-right">পার্থক্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-medium">
                {categories.map((c) => {
                  const diffVal = BigInt(c.diff);
                  const isIncreased = diffVal > 0n;
                  const isDecreased = diffVal < 0n;

                  return (
                    <tr key={c.categoryId} className="hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: `var(--c${c.color || 1})` }}
                          />
                          <span className="font-semibold text-foreground">
                            {c.categoryName}
                          </span>
                          {c.shortLabel && (
                            <CategoryChip label={c.shortLabel} color={c.color} size="sm" />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center text-muted-foreground font-mono">
                        {toBengaliDigits(c.txCount)} টি
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        <Money amount={c.currentAmount} />
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                        <Money amount={c.prevAmount} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                            isIncreased
                              ? 'bg-destructive/10 text-destructive'
                              : isDecreased
                              ? 'bg-pos/10 text-pos'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {isIncreased && <ArrowUp className="h-3 w-3" />}
                          {isDecreased && <ArrowDown className="h-3 w-3" />}
                          {!isIncreased && !isDecreased && <Minus className="h-3 w-3" />}
                          <Money amount={diffVal < 0n ? (-diffVal).toString() : diffVal.toString()} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
