import { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { packagePhotoApi } from "@/lib/package-photo-api";
import type { PackageDto } from "@macon/contracts";
import type { PackagePhoto } from "@/features/photos";

export function usePackageManager(onPackagesChange: () => void) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [packagePhotos, setPackagePhotos] = useState<PackagePhoto[]>([]);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const handleCreate = useCallback(() => {
    setIsCreating(true);
    setEditingPackageId(null);
    setPackagePhotos([]);
  }, []);

  const handleEdit = useCallback(async (pkg: PackageDto) => {
    setEditingPackageId(pkg.id);
    setIsCreating(true);

    // Load photos for this package
    try {
      const packageWithPhotos = await packagePhotoApi.getPackageWithPhotos(pkg.id);
      setPackagePhotos(packageWithPhotos.photos || []);
    } catch (err) {
      console.error("Failed to load package photos:", err);
      setPackagePhotos([]);
    }

    return pkg;
  }, []);

  const handleDelete = useCallback(async (packageId: string) => {
    if (!window.confirm("Are you sure you want to delete this package?")) {
      return;
    }

    try {
      const result = await api.tenantAdminDeletePackage({
        params: { id: packageId },
        body: undefined,
      });

      if (result.status === 204) {
        showSuccess("Package deleted successfully");
        onPackagesChange();
      } else {
        toast.error("Failed to delete package", {
          description: "Please try again or contact support.",
        });
      }
    } catch (err) {
      console.error("Failed to delete package:", err);
      toast.error("An error occurred while deleting the package", {
        description: "Please try again or contact support.",
      });
    }
  }, [showSuccess, onPackagesChange]);

  const handleCancel = useCallback(() => {
    setIsCreating(false);
    setEditingPackageId(null);
    setPackagePhotos([]);
  }, []);

  const handleFormSuccess = useCallback((message: string) => {
    showSuccess(message);
    setIsCreating(false);
    setEditingPackageId(null);
    setPackagePhotos([]);
  }, [showSuccess]);

  return {
    isCreating,
    editingPackageId,
    successMessage,
    packagePhotos,
    setPackagePhotos,
    handleCreate,
    handleEdit,
    handleDelete,
    handleCancel,
    handleFormSuccess,
  };
}
