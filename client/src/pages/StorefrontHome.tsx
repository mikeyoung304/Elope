/**
 * StorefrontHome Page
 *
 * Smart router that determines the customer's entry point:
 * - If tenant has segments (1-3): Show segment selector cards
 * - If tenant has no segments (0): Redirect to /tiers
 *
 * Route: / (root)
 *
 * Customer flow:
 * 1. Customer arrives at storefront root
 * 2. This page checks if segments exist
 * 3. If segments: show segment cards for customer to choose
 * 4. If no segments: redirect to /tiers for direct tier selection
 */

import { Navigate, Link } from 'react-router-dom';
import { Container } from '@/ui/Container';
import { Card, CardContent } from '@/components/ui/card';
import { Loading } from '@/ui/Loading';
import { FeatureErrorBoundary } from '@/components/errors';
import { useSegments } from '@/features/catalog/hooks';
import type { SegmentDto } from '@macon/contracts';

/**
 * Segment Card Component
 * Displays a clickable card for each customer segment
 */
function SegmentCard({ segment }: { segment: SegmentDto }) {
  return (
    <Link to={`/s/${segment.slug}`}>
      <Card
        className="overflow-hidden h-full transition-all duration-300 hover:shadow-elevation-3 hover:-translate-y-1 bg-white border-2 border-neutral-200 hover:border-macon-orange/30 shadow-elevation-1 cursor-pointer"
        data-testid={`segment-card-${segment.slug}`}
      >
        {/* Segment Hero Image */}
        {segment.heroImage ? (
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={segment.heroImage}
              alt={segment.heroTitle}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                {segment.heroTitle}
              </h3>
              {segment.heroSubtitle && (
                <p className="text-white/80 text-lg line-clamp-2">
                  {segment.heroSubtitle}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-macon-navy to-macon-teal/80 flex items-center justify-center">
            <div className="text-center p-6">
              <h3 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                {segment.heroTitle}
              </h3>
              {segment.heroSubtitle && (
                <p className="text-white/80 text-lg">
                  {segment.heroSubtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Segment Description */}
        {segment.description && (
          <CardContent className="p-6">
            <p className="text-neutral-600 leading-relaxed line-clamp-3">
              {segment.description}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}

function StorefrontHomeContent() {
  const { data: segments, isLoading, error } = useSegments();

  // Loading state
  if (isLoading) {
    return <Loading label="Loading storefront..." />;
  }

  // Error state - show a basic error and allow retry
  if (error) {
    return (
      <Container className="py-12">
        <div className="text-center py-20 bg-neutral-50 rounded-xl border-2 border-neutral-200">
          <p className="text-2xl text-macon-navy-600 mb-3 font-semibold">
            Unable to load storefront
          </p>
          <p className="text-lg text-neutral-600 mb-6">
            Please refresh the page to try again.
          </p>
        </div>
      </Container>
    );
  }

  // If no segments, redirect to root tiers
  if (!segments || segments.length === 0) {
    return <Navigate to="/tiers" replace />;
  }

  // Show segment selector
  return (
    <div className="py-12">
      <Container>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-macon-navy via-macon-orange to-macon-teal mb-4">
            What brings you here today?
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 max-w-3xl mx-auto">
            Choose the option that best describes what you're looking for
          </p>
        </div>

        {/* Segment Cards Grid */}
        <div className={`grid gap-8 ${
          segments.length === 1
            ? 'grid-cols-1 max-w-2xl mx-auto'
            : segments.length === 2
            ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {segments.map((segment: SegmentDto) => (
            <SegmentCard key={segment.id} segment={segment} />
          ))}
        </div>

        {/* Help text */}
        <div className="mt-12 text-center">
          <p className="text-neutral-500">
            Not sure which to choose? Pick the one that sounds closest to your needs.
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
