import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { usePackages } from "./hooks";
import type { PackageDto } from "@elope/contracts";
import { formatCurrency } from "@/lib/utils";

export function CatalogGrid() {
  const { data: packages, isLoading, error } = usePackages();

  if (isLoading) {
    return (
      <div className="text-center py-12 text-lavender-100 text-xl">
        Loading packages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-lavender-50 text-xl">
        Error loading packages: {error.message}
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return (
      <div className="text-center py-12 text-lavender-100 text-xl">
        No packages available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {packages.map((pkg: PackageDto) => (
        <Link key={pkg.id} to={`/package/${pkg.slug}`}>
          <Card className="overflow-hidden cursor-pointer h-full transition-all hover:shadow-elegant bg-navy-800 border-navy-600 hover:border-lavender-600 hover:shadow-lg">
            {pkg.photoUrl && (
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={pkg.photoUrl}
                  alt={pkg.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className="p-6">
              <h3 className="font-heading text-3xl font-semibold mb-3 text-lavender-50">
                {pkg.title}
              </h3>
              <p className="text-lavender-100 mb-4 line-clamp-2 text-lg leading-relaxed">
                {pkg.description}
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-navy-600">
                <span className="text-4xl font-heading font-semibold text-lavender-300">
                  {formatCurrency(pkg.priceCents)}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
