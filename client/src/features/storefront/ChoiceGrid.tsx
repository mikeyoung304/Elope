/**
 * ChoiceGrid Component
 *
 * Responsive grid layout for choice cards (segments or tiers).
 * Handles 1, 2, 3, or 4+ items elegantly with appropriate column layouts.
 *
 * Layout behavior:
 * - 1 item: Single column, centered with max-w-2xl
 * - 2 items: 2 columns on md+, centered with max-w-4xl
 * - 3+ items: 3 columns on lg, 2 on md, 1 on mobile (full width)
 */

import { clsx } from 'clsx';

interface ChoiceGridProps {
  children: React.ReactNode;
  itemCount: number;
}

export function ChoiceGrid({ children, itemCount }: ChoiceGridProps) {
  return (
    <div
      className={clsx(
        'grid gap-6 lg:gap-8',
        itemCount === 1 && 'grid-cols-1 max-w-2xl mx-auto',
        itemCount === 2 && 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto',
        itemCount >= 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      )}
    >
      {children}
    </div>
  );
}
