import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Plus, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { api } from "../../lib/api";
import type {
  PackageDto,
  AddOnDto,
  CreatePackageDto,
  UpdatePackageDto,
  CreateAddOnDto,
  UpdateAddOnDto,
} from "@macon/contracts";
import { PackageCard } from "./PackageCard";
import { PackageForm } from "./PackageForm";
import { AddOnManager } from "./AddOnManager";
import type { PackageFormData, AddOnFormData } from "./types";

interface PackagesManagerProps {
  packages: PackageDto[];
  onPackagesChange: () => void;
}

export function PackagesManager({ packages, onPackagesChange }: PackagesManagerProps) {
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  const [isAddingAddOn, setIsAddingAddOn] = useState<string | null>(null);
  const [editingAddOnId, setEditingAddOnId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletePackageDialogOpen, setDeletePackageDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteAddOnDialogOpen, setDeleteAddOnDialogOpen] = useState(false);
  const [addOnToDelete, setAddOnToDelete] = useState<{ id: string; title: string } | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [packageForm, setPackageForm] = useState<PackageFormData>({
    slug: "",
    title: "",
    description: "",
    priceCents: "",
    photoUrl: "",
  });

  const [addOnForm, setAddOnForm] = useState<AddOnFormData>({
    title: "",
    priceCents: "",
    photoUrl: "",
  });

  // Validate slug format
  const isValidSlug = (slug: string): boolean => {
    return /^[a-z0-9-]+$/.test(slug);
  };

  // Clear messages after delay
  const showSuccess = useCallback((message: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSuccessMessage(message);
    timeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
      timeoutRef.current = null;
    }, 3000);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Reset forms
  const resetPackageForm = useCallback(() => {
    setPackageForm({
      slug: "",
      title: "",
      description: "",
      priceCents: "",
      photoUrl: "",
    });
    setError(null);
  }, []);

  const resetAddOnForm = useCallback(() => {
    setAddOnForm({
      title: "",
      priceCents: "",
      photoUrl: "",
    });
    setError(null);
  }, []);

  // Package handlers
  const handleCreatePackage = useCallback(() => {
    resetPackageForm();
    setIsCreatingPackage(true);
    setEditingPackageId(null);
  }, [resetPackageForm]);

  const handleEditPackage = useCallback((pkg: PackageDto) => {
    setPackageForm({
      slug: pkg.slug,
      title: pkg.title,
      description: pkg.description,
      priceCents: pkg.priceCents.toString(),
      photoUrl: pkg.photoUrl || "",
    });
    setEditingPackageId(pkg.id);
    setIsCreatingPackage(true);
  }, []);

  const handleSavePackage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!packageForm.slug || !packageForm.title || !packageForm.description || !packageForm.priceCents) {
      setError("All fields except Photo URL are required");
      return;
    }

    if (!isValidSlug(packageForm.slug)) {
      setError("Slug must be lowercase with hyphens only (no spaces)");
      return;
    }

    const priceCents = parseInt(packageForm.priceCents, 10);
    if (isNaN(priceCents) || priceCents <= 0) {
      setError("Price must be a positive number");
      return;
    }

    setIsSaving(true);

    try {
      if (editingPackageId) {
        const updateData: UpdatePackageDto = {
          slug: packageForm.slug,
          title: packageForm.title,
          description: packageForm.description,
          priceCents,
          photoUrl: packageForm.photoUrl || undefined,
        };

        const result = await api.adminUpdatePackage({
          params: { id: editingPackageId },
          body: updateData,
        });

        if (result.status === 200) {
          showSuccess("Package updated successfully");
          setIsCreatingPackage(false);
          resetPackageForm();
          onPackagesChange();
        } else {
          setError("Failed to update package");
        }
      } else {
        const createData: CreatePackageDto = {
          slug: packageForm.slug,
          title: packageForm.title,
          description: packageForm.description,
          priceCents,
          photoUrl: packageForm.photoUrl || undefined,
        };

        const result = await api.adminCreatePackage({
          body: createData,
        });

        if (result.status === 200) {
          showSuccess("Package created successfully");
          setIsCreatingPackage(false);
          resetPackageForm();
          onPackagesChange();
        } else {
          setError("Failed to create package");
        }
      }
    } catch (err) {
      console.error("Failed to save package:", err);
      setError("An error occurred while saving the package");
    } finally {
      setIsSaving(false);
    }
  }, [packageForm, editingPackageId, showSuccess, resetPackageForm, onPackagesChange]);

  const handleDeletePackageClick = useCallback((packageId: string, packageTitle: string) => {
    setPackageToDelete({ id: packageId, title: packageTitle });
    setDeletePackageDialogOpen(true);
  }, []);

  const confirmDeletePackage = useCallback(async () => {
    if (!packageToDelete) return;

    try {
      const result = await api.adminDeletePackage({
        params: { id: packageToDelete.id },
        body: undefined,
      });

      if (result.status === 204) {
        showSuccess("Package deleted successfully");
        onPackagesChange();
        setDeletePackageDialogOpen(false);
        setPackageToDelete(null);
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
  }, [packageToDelete, showSuccess, onPackagesChange]);

  const cancelDeletePackage = useCallback(() => {
    setDeletePackageDialogOpen(false);
    setPackageToDelete(null);
  }, []);

  const handleCancelPackageForm = useCallback(() => {
    setIsCreatingPackage(false);
    resetPackageForm();
  }, [resetPackageForm]);

  // Add-on handlers
  const handleStartAddingAddOn = useCallback((packageId: string) => {
    resetAddOnForm();
    setIsAddingAddOn(packageId);
    setEditingAddOnId(null);
  }, [resetAddOnForm]);

  const handleEditAddOn = useCallback((addOn: AddOnDto) => {
    setAddOnForm({
      title: addOn.title,
      priceCents: addOn.priceCents.toString(),
      photoUrl: addOn.photoUrl || "",
    });
    setEditingAddOnId(addOn.id);
    setIsAddingAddOn(addOn.packageId);
  }, []);

  const handleSaveAddOn = useCallback(async (e: React.FormEvent, packageId: string) => {
    e.preventDefault();
    setError(null);

    if (!addOnForm.title || !addOnForm.priceCents) {
      setError("Title and price are required");
      return;
    }

    const priceCents = parseInt(addOnForm.priceCents, 10);
    if (isNaN(priceCents) || priceCents <= 0) {
      setError("Price must be a positive number");
      return;
    }

    setIsSaving(true);

    try {
      if (editingAddOnId) {
        const updateData: UpdateAddOnDto = {
          title: addOnForm.title,
          priceCents,
          photoUrl: addOnForm.photoUrl || undefined,
        };

        const result = await api.adminUpdateAddOn({
          params: { id: editingAddOnId },
          body: updateData,
        });

        if (result.status === 200) {
          showSuccess("Add-on updated successfully");
          setIsAddingAddOn(null);
          setEditingAddOnId(null);
          resetAddOnForm();
          onPackagesChange();
        } else {
          setError("Failed to update add-on");
        }
      } else {
        const createData: CreateAddOnDto = {
          packageId,
          title: addOnForm.title,
          priceCents,
          photoUrl: addOnForm.photoUrl || undefined,
        };

        const result = await api.adminCreateAddOn({
          params: { packageId },
          body: createData,
        });

        if (result.status === 200) {
          showSuccess("Add-on created successfully");
          setIsAddingAddOn(null);
          resetAddOnForm();
          onPackagesChange();
        } else {
          setError("Failed to create add-on");
        }
      }
    } catch (err) {
      console.error("Failed to save add-on:", err);
      setError("An error occurred while saving the add-on");
    } finally {
      setIsSaving(false);
    }
  }, [addOnForm, editingAddOnId, showSuccess, resetAddOnForm, onPackagesChange]);

  const handleDeleteAddOn = useCallback(async (addOnId: string) => {
    if (!window.confirm("Are you sure you want to delete this add-on?")) {
      return;
    }

    try {
      const result = await api.adminDeleteAddOn({
        params: { id: addOnId },
        body: undefined,
      });

      if (result.status === 204) {
        showSuccess("Add-on deleted successfully");
        onPackagesChange();
      } else {
        toast.error("Failed to delete add-on", {
          description: "Please try again or contact support.",
        });
      }
    } catch (err) {
      console.error("Failed to delete add-on:", err);
      toast.error("An error occurred while deleting the add-on", {
        description: "Please try again or contact support.",
      });
    }
  }, [showSuccess, onPackagesChange]);

  const handleCancelAddOn = useCallback(() => {
    setIsAddingAddOn(null);
    setEditingAddOnId(null);
    resetAddOnForm();
  }, [resetAddOnForm]);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 border border-macon-navy-600 bg-macon-navy-700 rounded-lg">
          <CheckCircle className="w-5 h-5 text-macon-navy-300" />
          <span className="text-lg font-medium text-macon-navy-100">{successMessage}</span>
        </div>
      )}

      {/* Create Package Button */}
      {!isCreatingPackage && (
        <div className="flex justify-end">
          <Button
            onClick={handleCreatePackage}
            className="bg-macon-navy hover:bg-macon-navy-dark text-lg h-12 px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Package
          </Button>
        </div>
      )}

      {/* Package Form */}
      {isCreatingPackage && (
        <PackageForm
          packageForm={packageForm}
          editingPackageId={editingPackageId}
          isSaving={isSaving}
          error={error}
          onFormChange={setPackageForm}
          onSubmit={handleSavePackage}
          onCancel={handleCancelPackageForm}
        />
      )}

      {/* Packages List */}
      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <h2 className="text-2xl font-semibold mb-4 text-macon-navy-50">Packages</h2>
        {packages.length === 0 ? (
          <p className="text-macon-navy-100 text-lg">No packages yet. Create your first package above.</p>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <div key={pkg.id}>
                <PackageCard
                  package={pkg}
                  isExpanded={expandedPackageId === pkg.id}
                  onToggleExpand={() =>
                    setExpandedPackageId(expandedPackageId === pkg.id ? null : pkg.id)
                  }
                  onEdit={handleEditPackage}
                  onDelete={handleDeletePackage}
                  onAddOnChange={onPackagesChange}
                />

                {expandedPackageId === pkg.id && (
                  <div className="mt-4 ml-4">
                    <AddOnManager
                      package={pkg}
                      isAddingAddOn={isAddingAddOn === pkg.id}
                      editingAddOnId={editingAddOnId}
                      addOnForm={addOnForm}
                      isSaving={isSaving}
                      error={error}
                      onFormChange={setAddOnForm}
                      onSubmit={(e) => handleSaveAddOn(e, pkg.id)}
                      onCancel={handleCancelAddOn}
                      onEdit={handleEditAddOn}
                      onDelete={handleDeleteAddOn}
                      onStartAdding={() => handleStartAddingAddOn(pkg.id)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
