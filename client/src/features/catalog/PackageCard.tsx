/**
 * PackageCard Component - Sprint 9
 * Individual package display card with photo, name, description, price
 */

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PackageDto } from '@macon/contracts';
import { formatCurrency } from '@/lib/utils';
import { truncateText } from '@/features/storefront';

interface PackageCardProps {
  package: PackageDto;
}

export function PackageCard({ package: pkg }: PackageCardProps) {
  return (
    <Card
      className="overflow-hidden h-full transition-all duration-300 hover:shadow-elevation-3 hover:-translate-y-1 bg-white border-neutral-200 hover:border-macon-orange/30 shadow-elevation-1"
      data-testid="package-card"
    >
      <Link to={`/package/${pkg.slug}`} className="block h-full flex flex-col">
        {/* Package Photo */}
        {pkg.photoUrl ? (
          <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
            <img
              src={pkg.photoUrl}
              alt={pkg.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ) : (
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-macon-navy/10 to-macon-navy/5 flex items-center justify-center">
            <span className="text-lg text-white/50 font-medium">No image</span>
          </div>
        )}

        {/* Package Info */}
        <CardContent className="p-6 flex-1 flex flex-col">
          {/* Package Title */}
          <h3 className="font-heading text-2xl md:text-3xl font-semibold mb-3 text-neutral-900 leading-tight">
            {pkg.title}
          </h3>

          {/* Package Description (truncated to 120 chars) */}
          <p className="text-lg text-neutral-600 mb-4 line-clamp-2 leading-relaxed flex-1">
            {truncateText(pkg.description, 120)}
          </p>

          {/* Price and CTA */}
          <div className="flex justify-between items-center pt-4 border-t border-neutral-200 mt-auto">
            <span className="text-3xl md:text-4xl font-heading font-semibold text-macon-orange">
              {formatCurrency(pkg.priceCents)}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] min-w-[120px] hover:bg-macon-orange hover:text-white hover:border-macon-orange transition-colors"
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
