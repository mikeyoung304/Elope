/**
 * TierSelector Component
 *
 * Displays tier cards in a responsive grid layout.
 * Filters packages by grouping field to show budget/middle/luxury tiers.
 *
 * Features:
 * - Extracts tiers from packages using grouping field convention
 * - Highlights middle tier as "Most Popular" (only when exactly 3 tiers)
 * - Responsive 1-2-3 column layout based on tier count
 * - Shows warning if fewer than 3 tiers configured
 * - Empty state when no tiers are available
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Container } from '@/ui/Container';
import { TierCard } from './TierCard';
import { ChoiceGrid } from './ChoiceGrid';
import type { PackageDto } from '@macon/contracts';
import { TIER_LEVELS, extractTiers } from './utils';

interface TierSelectorProps {
  /** All packages for this segment (or root) */
  packages: PackageDto[];
  /** Optional segment slug for routing */
  segmentSlug?: string;
  /** Title to display above tier cards */
  title?: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Link to go back to (e.g., "/" for segments) */
  backLink?: string;
  /** Back link text */
  backLinkText?: string;
}

export function TierSelector({
  packages,
  segmentSlug,
  title = 'Choose Your Experience',
  subtitle = 'Select the tier that best fits your needs',
  backLink,
  backLinkText = 'Back',
}: TierSelectorProps) {
  // Extract tiers from packages
  const tiers = useMemo(() => extractTiers(packages), [packages]);

  // Get list of configured tier levels
  const configuredTiers = useMemo(
    () => TIER_LEVELS.filter((level) => tiers[level] !== undefined),
    [tiers]
  );

  // Check completeness for warning display
  const isComplete = configuredTiers.length === 3;
  const missingTiers = TIER_LEVELS.filter((level) => !tiers[level]);

  return (
    <div className="py-12">
      <Container>
        {/* Back Link */}
        {backLink && (
          <Link
            to={backLink}
            className="inline-flex items-center text-macon-navy hover:text-macon-orange transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>{backLinkText}</span>
          </Link>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-macon-navy via-macon-orange to-macon-teal mb-4">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Warning if incomplete tiers */}
        {!isComplete && configuredTiers.length > 0 && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium">
                Some tiers are not yet configured
              </p>
              <p className="text-amber-700 text-sm">
                Missing:{' '}
                {missingTiers
                  .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
                  .join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Empty state if no tiers */}
        {configuredTiers.length === 0 && (
          <div className="text-center py-20 bg-neutral-50 rounded-xl border-2 border-neutral-200">
            <p className="text-2xl text-macon-navy-600 mb-3 font-semibold">
              Packages coming soon
            </p>
            <p className="text-lg text-neutral-600">
              We're putting together some wonderful options for you.
            </p>
          </div>
        )}

        {/* Tier Cards Grid */}
        {configuredTiers.length > 0 && (
          <ChoiceGrid itemCount={configuredTiers.length}>
            {TIER_LEVELS.map((tierLevel) => {
              const pkg = tiers[tierLevel];
              if (!pkg) return null;

              return (
                <TierCard
                  key={tierLevel}
                  package={pkg}
                  tierLevel={tierLevel}
                  segmentSlug={segmentSlug}
                  totalTierCount={configuredTiers.length}
                />
              );
            })}
          </ChoiceGrid>
        )}

        {/* Pricing Psychology Note - only show when 3 tiers */}
        {configuredTiers.length === 3 && (
          <div className="mt-12 text-center">
            <p className="text-neutral-500 text-sm">
              Not sure which to choose? Our{' '}
              <span className="font-medium text-macon-orange">Popular</span>{' '}
              tier is perfect for most customers.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
