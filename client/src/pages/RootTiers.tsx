/**
 * RootTiers Page
 *
 * Displays the 3-tier selection when tenant has no segments.
 * Route: /tiers
 *
 * Customer flow:
 * 1. StorefrontHome detects no segments, redirects here
 * 2. This page shows 3 tier cards (Budget/Middle/Luxury)
 * 3. Customer clicks a tier to see TierDetailPage
 */

import { Container } from '@/ui/Container';
import { TierSelector } from '@/features/storefront/TierSelector';
import { PackageCardSkeleton } from '@/components/ui/skeleton';
import { FeatureErrorBoundary } from '@/components/errors';
import { usePackages } from '@/features/catalog/hooks';
import type { PackageDto } from '@macon/contracts';

/** Valid tier levels */
const VALID_TIERS = ['budget', 'middle', 'luxury'] as const;

function RootTiersContent() {
  const { data: packages, isLoading, error, refetch } = usePackages();

  // Loading state
  if (isLoading) {
    return (
      <Container className="py-12">
        {/* Loading header */}
        <div className="text-center mb-12">
          <div className="h-12 w-2/3 mx-auto bg-neutral-200 rounded-lg animate-pulse mb-4" />
          <div className="h-6 w-1/2 mx-auto bg-neutral-100 rounded-lg animate-pulse" />
        </div>

        {/* Loading tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <PackageCardSkeleton key={i} />
          ))}
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-12">
        <div className="text-center py-20 bg-neutral-50 rounded-xl border-2 border-neutral-200">
          <p className="text-2xl text-macon-navy-600 mb-3 font-semibold">
            Unable to load packages
          </p>
          <p className="text-lg text-neutral-600 mb-6">
            Please try again in a moment.
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-macon-orange text-white rounded-lg hover:bg-macon-orange/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Container>
    );
  }

  // Filter to root packages (no segment) with valid tier groupings
  const rootPackages = (packages || []).filter((p: PackageDto) =>
    !p.segmentId &&
    p.grouping &&
    VALID_TIERS.includes(p.grouping.toLowerCase() as typeof VALID_TIERS[number])
  );

  return (
    <TierSelector
      packages={rootPackages}
      title="Choose Your Experience"
      subtitle="Select the tier that best fits your needs"
    />
  );
}

export function RootTiers() {
  return (
    <FeatureErrorBoundary featureName="Root Tiers">
      <RootTiersContent />
    </FeatureErrorBoundary>
  );
}
