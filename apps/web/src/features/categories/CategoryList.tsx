import React from 'react';
import type { Category } from '@hisab/shared';
import { CategoryChip } from '@/components/CategoryChip';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  onDelete?: (id: string) => void;
  title: string;
}

export const CategoryList: React.FC<CategoryListProps> = ({ categories, onDelete, title }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>{title}</span>
          <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {categories.length} টি
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">কোনো খাত যোগ করা হয়নি</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/60 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CategoryChip label={cat.shortLabel} color={cat.color} size="sm" />
                  <span
                    className="text-sm font-medium text-foreground truncate"
                    title={cat.name}
                  >
                    {cat.name}
                  </span>
                </div>
                {onDelete && (
                  <button
                    onClick={() => onDelete(cat.id)}
                    title="মুছে ফেলুন"
                    className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
