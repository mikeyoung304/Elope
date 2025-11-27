/**
 * TierCard Component
 *
 * Displays a single tier (package) in the 3-tier pricing layout.
 * Used in both segment-specific and root tier views.
 *
 * Features:
 * - Visual hierarchy with photo, name, price, description
 * - "Most Popular" badge for middle tier
 * - Consistent sizing for 3-up layout
 */

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PackageDto } from '@macon/contracts';
import { formatCurrency } from '@/lib/utils';

interface TierCardProps {
  package: PackageDto;
  /** The tier level: budget, middle, or luxury */
  tierLevel: 'budget' | 'middle' | 'luxury';
  /** Optional segment slug for routing */
  segmentSlug?: string;
  /** Whether to highlight this tier (typically middle tier) */
  highlighted?: boolean;
}

/**
 * Get tier display name based on tier level
 */
function getTierDisplayName(tierLevel: string): string {
  switch (tierLevel) {
    case 'budget':
      return 'Essential';
    case 'middle':
      return 'Popular';
    case 'luxury':
      return 'Premium';
    default:
      return tierLevel.charAt(0).toUpperCase() + tierLevel.slice(1);
  }
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function TierCard({
  package: pkg,
  tierLevel,
  segmentSlug,
  highlighted = false,
}: TierCardProps) {
  // Build the link to the tier detail page
  const detailLink = segmentSlug
    ? `/s/${segmentSlug}/${tierLevel}`
    : `/tiers/${tierLevel}`;

  return (
    <Card
      className={`
        relative overflow-hidden h-full transition-all duration-300
        hover:shadow-elevation-3 hover:-translate-y-1
        bg-white border-2
        ${highlighted
          ? 'border-macon-orange shadow-elevation-2 scale-[1.02]'
          : 'border-neutral-200 hover:border-macon-orange/30 shadow-elevation-1'
        }
      `}
      data-testid={`tier-card-${tierLevel}`}
    >
      {/* Most Popular Badge for middle tier */}
      {highlighted && (
        <Badge
          className="absolute top-4 right-4 z-10 bg-macon-orange text-white border-0"
        >
          Most Popular
        </Badge>
      )}

      <Link to={detailLink} className="block h-full flex flex-col">
        {/* Package Photo */}
        {pkg.photoUrl ? (
          <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
            <img
              src={pkg.photoUrl}
              alt={pkg.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {/* Tier level badge overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <span className="text-sm font-medium text-white/90 uppercase tracking-wide">
                {getTierDisplayName(tierLevel)}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-macon-navy/10 to-macon-navy/5 flex items-center justify-center">
            <span className="text-lg text-macon-navy/50 font-medium">
              {getTierDisplayName(tierLevel)}
            </span>
          </div>
        )}

        {/* Package Info */}
        <CardContent className="p-6 flex-1 flex flex-col">
          {/* Package Title */}
          <h3 className="font-heading text-2xl md:text-3xl font-semibold mb-2 text-neutral-900 leading-tight">
            {pkg.title}
          </h3>

          {/* Price */}
          <div className="mb-4">
            <span className="text-3xl md:text-4xl font-heading font-bold text-macon-orange">
              {formatCurrency(pkg.priceCents)}
            </span>
          </div>

          {/* Package Description (truncated to 150 chars) */}
          <p className="text-lg text-neutral-600 mb-6 line-clamp-3 leading-relaxed flex-1">
            {truncate(pkg.description, 150)}
          </p>

          {/* CTA Button */}
          <Button
            variant={highlighted ? 'default' : 'outline'}
            size="lg"
            className={`
              w-full min-h-[52px] text-lg font-medium
              ${highlighted
                ? 'bg-macon-orange hover:bg-macon-orange/90 text-white'
                : 'hover:bg-macon-orange hover:text-white hover:border-macon-orange'
              }
              transition-colors
            `}
          >
            View Details
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
}
