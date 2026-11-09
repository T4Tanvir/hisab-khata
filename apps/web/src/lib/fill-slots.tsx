import React from 'react';

/**
 * Like interpolate(), but each `{slot}` may be a React node (e.g. a <Money/>),
 * so translated sentences can contain formatted amounts in the right position.
 */
export function fillSlots(template: string, slots: Record<string, React.ReactNode>): React.ReactNode[] {
  return template
    .split(/\{(\w+)\}/)
    .map((part, i) => (i % 2 === 1 ? <React.Fragment key={i}>{slots[part] ?? part}</React.Fragment> : part));
}
