/**
 * SegmentCard Component
 *
 * Thin wrapper around ChoiceCardBase for segment display.
 * Used in StorefrontHome when tenant has multiple segments.
 *
 * Features:
 * - Maps SegmentDto fields to ChoiceCardBase props
 * - No price display (segments don't show price)
 * - CTA: "See Packages"
 * - Links to /s/{slug}
 * - Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import type { SegmentDto } from '@macon/contracts';
import { ChoiceCardBase } from './ChoiceCardBase';

interface SegmentCardProps {
  segment: SegmentDto;
}

export const SegmentCard = memo(function SegmentCard({ segment }: SegmentCardProps) {
  return (
    <ChoiceCardBase
      title={segment.heroTitle}
      description={segment.heroSubtitle || segment.description || ''}
      imageUrl={segment.heroImage}
      imageAlt={segment.heroTitle}
      categoryLabel={segment.name}
      cta="See Packages"
      href={`/s/${segment.slug}`}
      testId={`segment-card-${segment.slug}`}
    />
  );
});
