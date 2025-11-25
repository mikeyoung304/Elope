/**
 * Package Catalog Page - Sprint 9
 * Displays all active packages with search, filter, and sort capabilities
 */

import { useState, useEffect } from 'react';
import { Container } from '@/ui/Container';
import { PackageCard } from '@/features/catalog/PackageCard';
import { CatalogFilters } from '@/features/catalog/CatalogFilters';
import { PackageCardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { usePackages } from '@/features/catalog/hooks';
import { FeatureErrorBoundary } from '@/components/errors';
import type { PackageDto } from '@macon/contracts';

function PackageCatalogContent() {
  // Fetch packages
  const { data: packages, isLoading, error, refetch } = usePackages();

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc'>('price-asc');

  // Apply filters and sorting
  const filteredAndSortedPackages = packages
    ?.filter((pkg: PackageDto) => {
      // Search filter (search in title and description)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = pkg.title.toLowerCase().includes(query);
        const descMatch = pkg.description.toLowerCase().includes(query);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      // Price filter
      const priceInDollars = pkg.priceCents / 100;
      if (priceInDollars < priceRange.min || priceInDollars > priceRange.max) {
        return false;
      }

      return true;
    })
    .sort((a: PackageDto, b: PackageDto) => {
      // Sort logic
      if (sortBy === 'price-asc') {
        return a.priceCents - b.priceCents;
      }
      if (sortBy === 'price-desc') {
        return b.priceCents - a.priceCents;
      }
      return 0;
    });

  // Loading state
  if (isLoading) {
    return (
      <Container className="py-12">
        <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-macon-navy via-macon-orange to-macon-teal">
          Browse Packages
        </h1>
        <p className="text-xl md:text-2xl text-neutral-700 mb-12 leading-relaxed">
          Find the perfect package for your special day
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6 text-macon-navy">
          Browse Packages
        </h1>
        <div className="bg-danger-50 border-2 border-danger-200 rounded-xl p-8 max-w-2xl">
          <p className="text-xl text-danger-700 mb-4 font-medium">
            Failed to load packages. Please try again.
          </p>
          <Button
            onClick={() => refetch()}
            variant="secondary"
            size="lg"
            className="min-h-[44px]"
          >
            Retry
          </Button>
        </div>
      </Container>
    );
  }

  // Empty state (no packages exist)
  if (!packages || packages.length === 0) {
    return (
      <Container className="py-12">
        <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-macon-navy via-macon-orange to-macon-teal">
          Browse Packages
        </h1>
        <div className="text-center py-20 bg-neutral-50 rounded-xl border-2 border-neutral-200">
          <p className="text-2xl text-macon-navy-600 mb-3 font-semibold">
            Packages coming soon
          </p>
          <p className="text-xl text-white/50">
            We're putting the finishing touches on some great offerings. Check back shortly!
          </p>
        </div>
      </Container>
    );
  }

  // No results after filtering
  if (filteredAndSortedPackages && filteredAndSortedPackages.length === 0) {
    const hasActiveFilters = searchQuery || priceRange.min > 0 || priceRange.max < Infinity;

    return (
      <Container className="py-12">
        <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-macon-navy via-macon-orange to-macon-teal">
          Browse Packages
        </h1>
        <p className="text-xl md:text-2xl text-neutral-700 mb-12 leading-relaxed">
          Find the perfect package for your special day
        </p>

        <CatalogFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div className="text-center py-20 bg-neutral-50 rounded-xl border-2 border-neutral-200 mt-8">
          <p className="text-2xl text-macon-navy-600 mb-6 font-semibold">
            No packages match your filters
          </p>
          {hasActiveFilters && (
            <Button
              onClick={() => {
                setSearchQuery('');
                setPriceRange({ min: 0, max: Infinity });
              }}
              variant="outline"
              size="lg"
              className="min-h-[44px]"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Container>
    );
  }

  // Main catalog view
  return (
    <Container className="py-12">
      <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-macon-navy via-macon-orange to-macon-teal">
        Browse Packages
      </h1>
      <p className="text-xl md:text-2xl text-neutral-700 mb-12 leading-relaxed">
        Find the perfect package for your special day
      </p>

      <CatalogFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="mt-12">
        <p className="text-lg text-neutral-600 mb-6">
          Showing {filteredAndSortedPackages.length} {filteredAndSortedPackages.length === 1 ? 'package' : 'packages'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredAndSortedPackages.map((pkg: PackageDto) => (
            <PackageCard key={pkg.id} package={pkg} />
          ))}
        </div>
      </div>
    </Container>
  );
}

export function PackageCatalog() {
  return (
    <FeatureErrorBoundary featureName="Package Catalog">
      <PackageCatalogContent />
    </FeatureErrorBoundary>
  );
}
