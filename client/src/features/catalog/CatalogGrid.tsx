import { Link } from "react-router-dom";
import { Card } from "../../ui/Card";
import { usePackages } from "./hooks";
import type { PackageDto } from "@elope/contracts";

export function CatalogGrid() {
  const { data: packages, isLoading, error } = usePackages();

  if (isLoading) {
    return <div className="text-center py-12">Loading packages...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Error loading packages: {error.message}
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return <div className="text-center py-12">No packages available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg: PackageDto) => (
        <Link key={pkg.id} to={`/package/${pkg.slug}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            {pkg.photoUrl && (
              <img
                src={pkg.photoUrl}
                alt={pkg.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{pkg.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {pkg.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-600">
                  ${(pkg.priceCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
