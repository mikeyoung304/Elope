/**
 * TierSelector Component
 *
 * Displays 3 tier cards in a responsive grid layout.
 * Filters packages by grouping field to show budget/middle/luxury tiers.
 *
 * Features:
 * - Extracts tiers from packages using grouping field convention
 * - Highlights middle tier as "Most Popular"
 * - Responsive 1-2-3 column layout
 * - Shows warning if fewer than 3 tiers configured
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Container } from '@/ui/Container';
import { TierCard } from './TierCard';
import type { PackageDto } from '@macon/contracts';

/** Standard tier levels in display order */
const TIER_LEVELS = ['budget', 'middle', 'luxury'] as const;
type TierLevel = typeof TIER_LEVELS[number];

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

/**
 * Extract tiers from packages based on grouping field
 * Returns an object with budget, middle, luxury keys
 */
function extractTiers(packages: PackageDto[]): Record<TierLevel, PackageDto | undefined> {
  const tiers: Record<TierLevel, PackageDto | undefined> = {
    budget: undefined,
    middle: undefined,
    luxury: undefined,
  };

  for (const pkg of packages) {
    const grouping = pkg.grouping?.toLowerCase();
    if (grouping && TIER_LEVELS.includes(grouping as TierLevel)) {
      tiers[grouping as TierLevel] = pkg;
    }
  }

  return tiers;
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

  // Count how many tiers are configured
  const configuredTiers = useMemo(
    () => TIER_LEVELS.filter(level => tiers[level] !== undefined),
    [tiers]
  );

  // Check if all tiers are configured
  const isComplete = configuredTiers.length === 3;
  const missingTiers = TIER_LEVELS.filter(level => !tiers[level]);

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
                Missing: {missingTiers.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {TIER_LEVELS.map(tierLevel => {
              const pkg = tiers[tierLevel];
              if (!pkg) return null;

              return (
                <TierCard
                  key={tierLevel}
                  package={pkg}
                  tierLevel={tierLevel}
                  segmentSlug={segmentSlug}
                  highlighted={tierLevel === 'middle'}
                />
              );
            })}
          </div>
        )}

        {/* Pricing Psychology Note */}
        {configuredTiers.length >= 3 && (
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
