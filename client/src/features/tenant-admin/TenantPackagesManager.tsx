import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PackageDto, SegmentDto } from "@macon/contracts";
import { PackagePhotoUploader } from "@/components/PackagePhotoUploader";
import { SuccessMessage } from "@/components/shared/SuccessMessage";
import { api } from "@/lib/api";
import { usePackageForm } from "./packages/hooks/usePackageForm";
import { usePackageManager } from "./packages/hooks/usePackageManager";
import { PackageForm } from "./packages/PackageForm";
import { PackageList } from "./packages/PackageList";

interface TenantPackagesManagerProps {
  packages: PackageDto[];
  onPackagesChange: () => void;
}

/**
 * TenantPackagesManager Component
 *
 * Main coordinator for tenant package management.
 * Design: Matches landing page aesthetic with sage accents
 */
export function TenantPackagesManager({ packages, onPackagesChange }: TenantPackagesManagerProps) {
  // Segment state for organization dropdown
  const [segments, setSegments] = useState<SegmentDto[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);

  // Package management state and handlers
  const packageManager = usePackageManager(onPackagesChange);

  // Form state and handlers
  const packageForm = usePackageForm({
    onSuccess: packageManager.handleFormSuccess,
    onPackagesChange,
  });

  // Fetch segments on mount
  useEffect(() => {
    async function fetchSegments() {
      setIsLoadingSegments(true);
      try {
        const result = await api.tenantAdminGetSegments();
        if (result.status === 200) {
          setSegments(result.body);
        }
      } catch (error) {
        // Segments are optional - fail silently
        if (import.meta.env.DEV) {
          console.error("Failed to fetch segments:", error);
        }
      } finally {
        setIsLoadingSegments(false);
      }
    }
    fetchSegments();
  }, []);

  // Handle edit - load package into form and fetch photos
  const handleEdit = async (pkg: PackageDto) => {
    packageForm.loadPackage(pkg);
    await packageManager.handleEdit(pkg);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await packageForm.submitForm(packageManager.editingPackageId);
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <SuccessMessage message={packageManager.successMessage} />

      {/* Header with Create Button */}
      {!packageManager.isCreating && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-text-primary">Your Packages</h2>
            <p className="text-text-muted text-sm mt-1">
              {packages.length === 0
                ? "Create your first package to get started"
                : `${packages.length} package${packages.length !== 1 ? "s" : ""} available`}
            </p>
          </div>
          <Button
            onClick={packageManager.handleCreate}
            className="bg-sage hover:bg-sage-hover text-white rounded-full px-6 h-11 shadow-soft hover:shadow-medium transition-all duration-300 group"
          >
            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Create Package
          </Button>
        </div>
      )}

      {/* Package Form */}
      {packageManager.isCreating && (
        <PackageForm
          form={packageForm.form}
          setForm={packageForm.setForm}
          isSaving={packageForm.isSaving}
          error={packageForm.error}
          editingPackageId={packageManager.editingPackageId}
          onSubmit={handleSubmit}
          onCancel={packageManager.handleCancel}
          segments={segments}
          isLoadingSegments={isLoadingSegments}
        />
      )}

      {/* Package Photo Uploader - Only show when editing existing package */}
      {packageManager.isCreating && packageManager.editingPackageId && (
        <PackagePhotoUploader
          packageId={packageManager.editingPackageId}
          initialPhotos={packageManager.packagePhotos}
          onPhotosChange={packageManager.setPackagePhotos}
        />
      )}

      {/* Packages List */}
      <PackageList
        packages={packages}
        onEdit={handleEdit}
        onDelete={packageManager.handleDelete}
      />
    </div>
  );
}
