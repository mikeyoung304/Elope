import { useState } from "react";
import { Pencil, Trash2, Image, Package, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";
import type { PackageDto } from "@macon/contracts";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<PackageDto | null>(null);

  const handleDeleteClick = (pkg: PackageDto) => {
    setPackageToDelete(pkg);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (packageToDelete) {
      onDelete(packageToDelete.id);
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setPackageToDelete(null);
  };

  if (packages.length === 0) {
    return (
      <Card className="p-6 bg-macon-navy-800 border-white/20">
        <h2 className="text-2xl font-semibold mb-4 text-white">Packages</h2>
        <EmptyState
          icon={Package}
          title="Ready to showcase your services"
          description="Create your first package to start accepting bookings. Your packages will appear here."
          className="py-8"
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-macon-navy-800 border-white/20">
      <h2 className="text-2xl font-semibold mb-4 text-white">Packages</h2>
      <div className="space-y-3">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="flex items-center gap-4 p-4 bg-macon-navy-700 border border-white/20 rounded-lg"
          >
            {/* Photo Thumbnail */}
            <div className="relative flex-shrink-0">
              {pkg.photos && pkg.photos.length > 0 ? (
                <div className="relative">
                  <img
                    src={pkg.photos[0].url}
                    alt={`${pkg.title} preview`}
                    className="w-24 h-24 object-cover rounded-lg border-2 border-white/30"
                  />
                  {pkg.photos.length > 1 && (
                    <Badge
                      className="absolute -top-2 -right-2 bg-macon-orange text-white border-macon-navy-700"
                    >
                      {pkg.photos.length}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 flex items-center justify-center bg-macon-navy-600 border-2 border-white/30 rounded-lg">
                  <Image className="w-8 h-8 text-white/50" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-white">{pkg.title}</h3>
                <Badge
                  variant="outline"
                  className={pkg.isActive !== false
                    ? "border-green-500 bg-green-900/20 text-green-300"
                    : "border-red-500 bg-red-900/20 text-red-300"}
                >
                  {pkg.isActive !== false ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-base text-white/70 mt-1">{pkg.description}</p>
              <div className="flex gap-4 mt-2 text-base text-white/90">
                <span className="font-medium text-white/60">
                  {formatCurrency(pkg.priceCents)}
                </span>
                {/* TODO: Add minLeadDays field to backend schema and API contract */}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onEdit(pkg)}
                variant="outline"
                size="sm"
                className="border-white/30 text-white/90 hover:bg-macon-navy-600"
                aria-label={`Edit package: ${pkg.title}`}
                title="Edit package"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleDeleteClick(pkg)}
                variant="outline"
                size="sm"
                className="border-red-700 text-red-300 hover:bg-red-900/20"
                aria-label={`Delete package: ${pkg.title}`}
                title="Delete package"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-macon-navy-800 border-white/20">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-danger-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-danger-700" />
              </div>
              <AlertDialogTitle className="text-2xl">Delete Package?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base text-macon-navy-600 dark:text-white/60">
              Are you sure you want to delete <strong className="font-semibold text-macon-navy-900 dark:text-white">"{packageToDelete?.title}"</strong>?
            </AlertDialogDescription>
            <div className="mt-3 p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
              <p className="text-sm text-danger-800 dark:text-danger-300 font-medium">
                ⚠️ This action cannot be undone
              </p>
              <ul className="mt-2 text-sm text-danger-700 dark:text-danger-400 space-y-1 list-disc list-inside">
                <li>Package will be permanently removed</li>
                <li>It will no longer be available for new bookings</li>
                <li>Existing bookings will not be affected</li>
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={cancelDelete}
              className="bg-macon-navy-100 hover:bg-macon-navy-200 text-macon-navy-900 border-macon-navy-300"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-danger-600 hover:bg-danger-700 text-white focus:ring-danger-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Package
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
