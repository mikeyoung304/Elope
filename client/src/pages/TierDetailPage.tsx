/**
 * TierDetailPage
 *
 * Displays the full detail view for a selected tier.
 * Routes:
 * - /s/:slug/:tier - Segment-specific tier
 * - /tiers/:tier - Root tier (no segment)
 *
 * Customer flow:
 * 1. Customer selects a tier from TierSelector
 * 2. This page shows full details with prev/next navigation
 * 3. Customer can book or navigate to other tiers
 */

import { useParams, Navigate } from 'react-router-dom';
import { TierDetail } from '@/features/storefront/TierDetail';
import { Loading } from '@/ui/Loading';
import { FeatureErrorBoundary } from '@/components/errors';
import { useSegmentWithPackages, usePackages } from '@/features/catalog/hooks';
import type { PackageDto } from '@macon/contracts';

/** Valid tier levels */
const VALID_TIERS = ['budget', 'middle', 'luxury'] as const;
type TierLevel = typeof VALID_TIERS[number];

/**
 * Segment Tier Detail - /s/:slug/:tier
 */
function SegmentTierDetailContent() {
  const { slug, tier } = useParams<{ slug: string; tier: string }>();
  const { data: segment, isLoading, error } = useSegmentWithPackages(slug || '');

  // Validate params
  if (!slug || !tier) {
    return <Navigate to="/" replace />;
  }

  // Validate tier level
  const tierLevel = tier.toLowerCase();
  if (!VALID_TIERS.includes(tierLevel as TierLevel)) {
    return <Navigate to={`/s/${slug}`} replace />;
  }

  // Loading state
  if (isLoading) {
    return <Loading label="Loading tier details..." />;
  }

  // Error or not found
  if (error || !segment) {
    return <Navigate to="/" replace />;
  }

  const packages = segment.packages || [];

  // Find the package matching this tier
  const pkg = packages.find((p: PackageDto) => p.grouping?.toLowerCase() === tierLevel);

  if (!pkg) {
    return <Navigate to={`/s/${slug}`} replace />;
  }

  return (
    <TierDetail
      package={pkg}
      tierLevel={tierLevel as TierLevel}
      allPackages={packages}
      segmentSlug={slug}
      segmentName={segment.name}
    />
  );
}

/**
 * Root Tier Detail - /tiers/:tier (no segment)
 */
function RootTierDetailContent() {
  const { tier } = useParams<{ tier: string }>();
  const { data: packages, isLoading, error } = usePackages();

  // Validate tier param
  if (!tier) {
    return <Navigate to="/tiers" replace />;
  }

  // Validate tier level
  const tierLevel = tier.toLowerCase();
  if (!VALID_TIERS.includes(tierLevel as TierLevel)) {
    return <Navigate to="/tiers" replace />;
  }

  // Loading state
  if (isLoading) {
    return <Loading label="Loading tier details..." />;
  }

  // Error or not found
  if (error || !packages) {
    return <Navigate to="/tiers" replace />;
  }

  // Filter to root packages (no segment) with valid tier groupings
  const rootPackages = packages.filter((p: PackageDto) =>
    !p.segmentId &&
    p.grouping &&
    VALID_TIERS.includes(p.grouping.toLowerCase() as TierLevel)
  );

  // Find the package matching this tier
  const pkg = rootPackages.find((p: PackageDto) => p.grouping?.toLowerCase() === tierLevel);

  if (!pkg) {
    return <Navigate to="/tiers" replace />;
  }

  return (
    <TierDetail
      package={pkg}
      tierLevel={tierLevel as TierLevel}
      allPackages={rootPackages}
    />
  );
}

/**
 * Segment Tier Detail Page - /s/:slug/:tier
 */
export function SegmentTierDetail() {
  return (
    <FeatureErrorBoundary featureName="Tier Detail">
      <SegmentTierDetailContent />
    </FeatureErrorBoundary>
  );
}

/**
 * Root Tier Detail Page - /tiers/:tier
 */
export function RootTierDetail() {
  return (
    <FeatureErrorBoundary featureName="Tier Detail">
      <RootTierDetailContent />
    </FeatureErrorBoundary>
  );
}
