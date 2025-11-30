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
 * - Uses relative links (s/{slug}) for tenant storefront compatibility
 * - Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import type { SegmentDto } from '@macon/contracts';
import { ChoiceCardBase } from './ChoiceCardBase';

interface SegmentCardProps {
  segment: SegmentDto;
}

export const SegmentCard = memo(function SegmentCard({ segment }: SegmentCardProps) {
  // Use relative path so it works within tenant storefront (/t/:tenantSlug)
  // "s/wellness" resolves to "/t/plate/s/wellness" when inside /t/plate
  return (
    <ChoiceCardBase
      title={segment.heroTitle}
      description={segment.heroSubtitle || segment.description || ''}
      imageUrl={segment.heroImage}
      imageAlt={segment.heroTitle}
      categoryLabel={segment.name}
      cta="See Packages"
      href={`s/${segment.slug}`}
      testId={`segment-card-${segment.slug}`}
    />
  );
});
