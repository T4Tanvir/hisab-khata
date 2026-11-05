import React from 'react';

interface CategoryChipProps {
  label: string;
  color?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  color = 1,
  className = '',
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'chip-sm' : '';
  const colorVar = `var(--c${color})`;

  return (
    <span
      className={`chip ${sizeClass} ${className}`.trim()}
      style={{ backgroundColor: colorVar, color: '#fff' }}
    >
      {label}
    </span>
  );
};

