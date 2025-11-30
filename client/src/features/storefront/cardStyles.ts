/**
 * Shared Card Styles
 *
 * Extracted styling constants for ChoiceCardBase component.
 * Used by both SegmentCard and TierCard wrappers.
 */

import { clsx } from 'clsx';

export const cardStyles = {
  /** Base styles applied to all cards */
  base: clsx(
    'group relative overflow-hidden h-full flex flex-col',
    'transition-all duration-300 ease-out',
    'hover:shadow-elevation-3 hover:-translate-y-1',
    'bg-white border-2 rounded-xl',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-macon-orange focus-visible:ring-offset-2'
  ),

  /** Normal (non-highlighted) card styles */
  normal: 'border-neutral-200 hover:border-macon-orange/30 shadow-elevation-1',

  /** Highlighted card styles (middle tier with "Most Popular" badge) */
  highlighted: 'border-macon-orange shadow-elevation-2 scale-[1.02]',
};
