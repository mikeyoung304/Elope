/**
 * StorefrontHome Page
 *
 * Smart router that determines the customer's entry point:
 * - If tenant has 0 segments: Redirect to /tiers (with replace)
 * - If tenant has 1 segment: Skip to that segment's tiers (without replace for back button)
 * - If tenant has 2+ segments: Show segment selector cards
 *
 * Route: / (root)
 *
 * Customer flow:
 * 1. Customer arrives at storefront root
 * 2. This page checks segment count
 * 3. 0 segments: redirect to /tiers for direct tier selection
 * 4. 1 segment: auto-skip to /s/{slug} (back button works)
 * 5. 2+ segments: show segment cards for customer to choose
 */

import { Navigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Container } from '@/ui/Container';
import { Loading } from '@/ui/Loading';
import { FeatureErrorBoundary } from '@/components/errors';
import { useSegments } from '@/features/catalog/hooks';
import { SegmentCard, ChoiceGrid } from '@/features/storefront';

function StorefrontHomeContent() {
  const { data: segments, isLoading, error } = useSegments();

  // Loading state - show spinner before making routing decisions
  if (isLoading) {
    return <Loading label="Loading storefront..." />;
  }

  // Error state - show a basic error and allow retry
  if (error) {
    return (
      <Container className="py-12">
        <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200">
          <AlertTriangle className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            Unable to load storefront
          </h3>
          <p className="text-neutral-600">
            Please refresh the page to try again.
          </p>
        </div>
      </Container>
    );
  }

  // 0 segments: redirect to root tiers (with replace - no back needed)
  // Use relative path "tiers" so it resolves correctly within /t/:tenantSlug
  if (!segments || segments.length === 0) {
    return <Navigate to="tiers" replace />;
  }

  // 1 segment: auto-skip to that segment's tiers (without replace for back button)
  // Use relative path "s/{slug}" so it resolves correctly within /t/:tenantSlug
  if (segments.length === 1) {
    return <Navigate to={`s/${segments[0].slug}`} />;
  }

  // 2+ segments: show segment selector
  return (
    <div className="py-12">
      <Container>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-4">
            What brings you here today?
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 max-w-3xl mx-auto">
            Choose the option that best describes what you're looking for
          </p>
        </div>

        {/* Segment Cards Grid */}
        <ChoiceGrid itemCount={segments.length}>
          {segments.map((segment) => (
            <SegmentCard key={segment.id} segment={segment} />
          ))}
        </ChoiceGrid>

        {/* Help text */}
        <div className="mt-12 text-center">
          <p className="text-neutral-500">
            Not sure which to choose? Pick the one that sounds closest to your
            needs.
          </p>
        </div>
      </Container>
    </div>
  );
}

export function StorefrontHome() {
  return (
    <FeatureErrorBoundary featureName="Storefront">
      <StorefrontHomeContent />
    </FeatureErrorBoundary>
  );
}
