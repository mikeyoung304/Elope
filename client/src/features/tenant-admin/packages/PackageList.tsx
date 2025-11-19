import { Pencil, Trash2, Image, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { PackageDto } from "@elope/contracts";

interface PackageListProps {
  packages: PackageDto[];
  onEdit: (pkg: PackageDto) => void;
  onDelete: (packageId: string) => void;
}

/**
 * PackageList Component
 *
 * Displays a list of packages with edit and delete actions
 */
export function PackageList({ packages, onEdit, onDelete }: PackageListProps) {
  if (packages.length === 0) {
    return (
      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <h2 className="text-2xl font-semibold mb-4 text-macon-navy-50">Packages</h2>
        <EmptyState
          icon={Package}
          title="No wedding packages yet"
          description="Create your first package above to start accepting bookings for your venue"
          className="py-8"
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
      <h2 className="text-2xl font-semibold mb-4 text-macon-navy-50">Packages</h2>
      <div className="space-y-3">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="flex items-center gap-4 p-4 bg-macon-navy-700 border border-macon-navy-600 rounded-lg"
          >
            {/* Photo Thumbnail */}
            <div className="relative flex-shrink-0">
              {(pkg as any).photos && (pkg as any).photos.length > 0 ? (
                <div className="relative">
                  <img
                    src={(pkg as any).photos[0].url}
                    alt={`${pkg.title} preview`}
                    className="w-24 h-24 object-cover rounded-lg border-2 border-macon-navy-500"
                  />
                  {(pkg as any).photos.length > 1 && (
                    <Badge
                      className="absolute -top-2 -right-2 bg-macon-orange text-white border-macon-navy-700"
                    >
                      {(pkg as any).photos.length}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 flex items-center justify-center bg-macon-navy-600 border-2 border-macon-navy-500 rounded-lg">
                  <Image className="w-8 h-8 text-macon-navy-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-macon-navy-50">{pkg.title}</h3>
                <Badge
                  variant="outline"
                  className={(pkg as any).isActive !== false
                    ? "border-green-500 bg-green-900/20 text-green-300"
                    : "border-red-500 bg-red-900/20 text-red-300"}
                >
                  {(pkg as any).isActive !== false ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-base text-macon-navy-200 mt-1">{pkg.description}</p>
              <div className="flex gap-4 mt-2 text-base text-macon-navy-100">
                <span className="font-medium text-macon-navy-300">
                  {formatCurrency(pkg.priceCents)}
                </span>
                {(pkg as any).minLeadDays && (
                  <span>Min {(pkg as any).minLeadDays} days notice</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onEdit(pkg)}
                variant="outline"
                size="sm"
                className="border-macon-navy-500 text-macon-navy-100 hover:bg-macon-navy-600"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onDelete(pkg.id)}
                variant="outline"
                size="sm"
                className="border-red-700 text-red-300 hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
