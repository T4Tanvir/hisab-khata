import React from 'react';
import type { Category } from '@hisab/shared';
import { CategoryChip } from '@/components/CategoryChip';
import { Trash2 } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  onDelete?: (id: string) => void;
  title: string;
}

export const CategoryList: React.FC<CategoryListProps> = ({ categories, onDelete, title }) => {
  return (
    <div className="panel" style={{ padding: '1.25rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--ink)' }}>
        {title} ({categories.length})
      </h3>

      {categories.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>কোনো খাত যোগ করা হয়নি</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.8rem',
                backgroundColor: 'var(--surface-2)',
                borderRadius: '8px',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                <CategoryChip label={cat.shortLabel} color={cat.color} size="sm" />
                <span
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={cat.name}
                >
                  {cat.name}
                </span>
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(cat.id)}
                  title="মুছে ফেলুন"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
