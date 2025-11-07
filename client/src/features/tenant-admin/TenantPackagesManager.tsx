import { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api } from "../../lib/api";
import { formatCurrency } from "@/lib/utils";
import type { PackageDto } from "@elope/contracts";
import { PackagePhotoUploader, type PackagePhoto } from "@/components/PackagePhotoUploader";
import { packagePhotoApi } from "@/lib/package-photo-api";

interface PackageFormData {
  title: string;
  description: string;
  priceCents: string;
  minLeadDays: string;
  isActive: boolean;
}

interface TenantPackagesManagerProps {
  packages: PackageDto[];
  onPackagesChange: () => void;
}

export function TenantPackagesManager({ packages, onPackagesChange }: TenantPackagesManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [packagePhotos, setPackagePhotos] = useState<PackagePhoto[]>([]);

  const [form, setForm] = useState<PackageFormData>({
    title: "",
    description: "",
    priceCents: "",
    minLeadDays: "7",
    isActive: true,
  });

  const resetForm = useCallback(() => {
    setForm({
      title: "",
      description: "",
      priceCents: "",
      minLeadDays: "7",
      isActive: true,
    });
    setError(null);
    setPackagePhotos([]);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const handleCreate = useCallback(() => {
    resetForm();
    setIsCreating(true);
    setEditingPackageId(null);
  }, [resetForm]);

  const handleEdit = useCallback(async (pkg: PackageDto) => {
    setForm({
      title: pkg.title,
      description: pkg.description,
      priceCents: pkg.priceCents.toString(),
      minLeadDays: (pkg as any).minLeadDays?.toString() || "7",
      isActive: (pkg as any).isActive !== false,
    });
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
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title || !form.description || !form.priceCents) {
      setError("Title, description, and price are required");
      return;
    }

    const priceCents = parseInt(form.priceCents, 10);
    const minLeadDays = parseInt(form.minLeadDays, 10);

    if (isNaN(priceCents) || priceCents <= 0) {
      setError("Price must be a positive number");
      return;
    }

    if (isNaN(minLeadDays) || minLeadDays < 0) {
      setError("Min lead days must be a non-negative number");
      return;
    }

    setIsSaving(true);

    try {
      const data = {
        title: form.title,
        description: form.description,
        priceCents,
        minLeadDays,
        isActive: form.isActive,
      };

      if (editingPackageId) {
        const result = await (api as any).tenantUpdatePackage({
          params: { id: editingPackageId },
          body: data,
        });

        if (result.status === 200) {
          showSuccess("Package updated successfully");
          setIsCreating(false);
          resetForm();
          onPackagesChange();
        } else {
          setError("Failed to update package");
        }
      } else {
        const result = await (api as any).tenantCreatePackage({
          body: data,
        });

        if (result.status === 200) {
          showSuccess("Package created successfully");
          setIsCreating(false);
          resetForm();
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
  }, [form, editingPackageId, showSuccess, resetForm, onPackagesChange]);

  const handleDelete = useCallback(async (packageId: string) => {
    if (!window.confirm("Are you sure you want to delete this package?")) {
      return;
    }

    try {
      const result = await (api as any).tenantDeletePackage({
        params: { id: packageId },
        body: undefined,
      });

      if (result.status === 204) {
        showSuccess("Package deleted successfully");
        onPackagesChange();
      } else {
        alert("Failed to delete package");
      }
    } catch (err) {
      console.error("Failed to delete package:", err);
      alert("An error occurred while deleting the package");
    }
  }, [showSuccess, onPackagesChange]);

  const handleCancel = useCallback(() => {
    setIsCreating(false);
    resetForm();
  }, [resetForm]);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 border border-lavender-600 bg-navy-700 rounded-lg">
          <CheckCircle className="w-5 h-5 text-lavender-300" />
          <span className="text-lg font-medium text-lavender-100">{successMessage}</span>
        </div>
      )}

      {/* Create Button */}
      {!isCreating && (
        <div className="flex justify-end">
          <Button
            onClick={handleCreate}
            className="bg-lavender-500 hover:bg-lavender-600 text-lg h-12 px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Package
          </Button>
        </div>
      )}

      {/* Package Form */}
      {isCreating && (
        <Card className="p-6 bg-navy-800 border-navy-600">
          <h2 className="text-2xl font-semibold mb-4 text-lavender-50">
            {editingPackageId ? "Edit Package" : "Create New Package"}
          </h2>

          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 border border-navy-600 bg-navy-700 rounded-lg">
              <AlertCircle className="w-5 h-5 text-lavender-200" />
              <span className="text-base text-lavender-100">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-lavender-100 text-lg">
                Title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Romantic Sunset Package"
                disabled={isSaving}
                className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-lavender-100 text-lg">
                Description <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="A beautiful sunset ceremony..."
                disabled={isSaving}
                className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceCents" className="text-lavender-100 text-lg">
                  Price (cents) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="priceCents"
                  type="number"
                  value={form.priceCents}
                  onChange={(e) => setForm({ ...form, priceCents: e.target.value })}
                  placeholder="50000"
                  min="0"
                  disabled={isSaving}
                  className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                  required
                />
                <p className="text-base text-lavender-200">
                  {form.priceCents && !isNaN(parseInt(form.priceCents, 10))
                    ? formatCurrency(parseInt(form.priceCents, 10))
                    : "Enter price in cents (e.g., 50000 = $500.00)"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minLeadDays" className="text-lavender-100 text-lg">
                  Min Lead Days
                </Label>
                <Input
                  id="minLeadDays"
                  type="number"
                  value={form.minLeadDays}
                  onChange={(e) => setForm({ ...form, minLeadDays: e.target.value })}
                  placeholder="7"
                  min="0"
                  disabled={isSaving}
                  className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                />
                <p className="text-base text-lavender-200">Days before event date required</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                disabled={isSaving}
                className="w-5 h-5 rounded border-navy-600 bg-navy-900 text-lavender-500 focus:ring-lavender-500"
              />
              <Label htmlFor="isActive" className="text-lavender-100 text-lg cursor-pointer">
                Active (available for booking)
              </Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-lavender-500 hover:bg-lavender-600 text-lg h-12 px-6"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSaving ? "Saving..." : editingPackageId ? "Update Package" : "Create Package"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="border-navy-600 text-lavender-100 hover:bg-navy-700 text-lg h-12 px-6"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Package Photo Uploader - Only show when editing existing package */}
      {isCreating && editingPackageId && (
        <PackagePhotoUploader
          packageId={editingPackageId}
          initialPhotos={packagePhotos}
          onPhotosChange={(photos) => setPackagePhotos(photos)}
        />
      )}

      {/* Packages List */}
      <Card className="p-6 bg-navy-800 border-navy-600">
        <h2 className="text-2xl font-semibold mb-4 text-lavender-50">Packages</h2>
        {packages.length === 0 ? (
          <p className="text-lavender-100 text-lg">No packages yet. Create your first package above.</p>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center justify-between p-4 bg-navy-700 border border-navy-600 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-lavender-50">{pkg.title}</h3>
                    <Badge
                      variant="outline"
                      className={(pkg as any).isActive !== false
                        ? "border-green-500 bg-green-900/20 text-green-300"
                        : "border-red-500 bg-red-900/20 text-red-300"}
                    >
                      {(pkg as any).isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-base text-lavender-200 mt-1">{pkg.description}</p>
                  <div className="flex gap-4 mt-2 text-base text-lavender-100">
                    <span className="font-medium text-lavender-300">
                      {formatCurrency(pkg.priceCents)}
                    </span>
                    {(pkg as any).minLeadDays && (
                      <span>Min {(pkg as any).minLeadDays} days notice</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(pkg)}
                    variant="outline"
                    size="sm"
                    className="border-navy-500 text-lavender-100 hover:bg-navy-600"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(pkg.id)}
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
        )}
      </Card>
    </div>
  );
}
