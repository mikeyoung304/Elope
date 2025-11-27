import { useState, useEffect } from "react";
import { Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PackageDto, SegmentDto } from "@macon/contracts";
import { PackagePhotoUploader } from "@/components/PackagePhotoUploader";
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
 * Refactored to use custom hooks and smaller components.
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
        console.error("Failed to fetch segments:", error);
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
      {packageManager.successMessage && (
        <div className="flex items-center gap-2 p-4 border border-white/20 bg-macon-navy-700 rounded-lg">
          <CheckCircle className="w-5 h-5 text-white/60" />
          <span className="text-lg font-medium text-white/90">{packageManager.successMessage}</span>
        </div>
      )}

      {/* Create Button */}
      {!packageManager.isCreating && (
        <div className="flex justify-end">
          <Button
            onClick={packageManager.handleCreate}
            className="bg-macon-navy hover:bg-macon-navy-dark text-lg h-12 px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
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
