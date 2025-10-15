import { useState } from "react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { api } from "../../lib/api";
import type { PackageDto, AddOnDto, CreatePackageDto, UpdatePackageDto, CreateAddOnDto, UpdateAddOnDto } from "@elope/contracts";

interface PackagesManagerProps {
  packages: PackageDto[];
  onPackagesChange: () => void;
}

interface PackageFormData {
  slug: string;
  title: string;
  description: string;
  priceCents: string;
  photoUrl: string;
}

interface AddOnFormData {
  title: string;
  priceCents: string;
  photoUrl: string;
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

  // Format price as currency
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Validate slug format
  const isValidSlug = (slug: string): boolean => {
    return /^[a-z0-9-]+$/.test(slug);
  };

  // Clear messages after delay
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Reset package form
  const resetPackageForm = () => {
    setPackageForm({
      slug: "",
      title: "",
      description: "",
      priceCents: "",
      photoUrl: "",
    });
    setError(null);
  };

  // Reset add-on form
  const resetAddOnForm = () => {
    setAddOnForm({
      title: "",
      priceCents: "",
      photoUrl: "",
    });
    setError(null);
  };

  // Handle create package
  const handleCreatePackage = () => {
    resetPackageForm();
    setIsCreatingPackage(true);
    setEditingPackageId(null);
  };

  // Handle edit package
  const handleEditPackage = (pkg: PackageDto) => {
    setPackageForm({
      slug: pkg.slug,
      title: pkg.title,
      description: pkg.description,
      priceCents: pkg.priceCents.toString(),
      photoUrl: pkg.photoUrl || "",
    });
    setEditingPackageId(pkg.id);
    setIsCreatingPackage(true);
  };

  // Handle save package (create or update)
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
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
        // Update existing package
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
        // Create new package
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
  };

  // Handle delete package
  const handleDeletePackage = async (packageId: string) => {
    if (!window.confirm("Are you sure you want to delete this package? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await api.adminDeletePackage({
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
  };

  // Handle add add-on
  const handleAddAddOn = (packageId: string) => {
    resetAddOnForm();
    setIsAddingAddOn(packageId);
    setEditingAddOnId(null);
  };

  // Handle edit add-on
  const handleEditAddOn = (addOn: AddOnDto) => {
    setAddOnForm({
      title: addOn.title,
      priceCents: addOn.priceCents.toString(),
      photoUrl: addOn.photoUrl || "",
    });
    setEditingAddOnId(addOn.id);
    setIsAddingAddOn(addOn.packageId);
  };

  // Handle save add-on (create or update)
  const handleSaveAddOn = async (e: React.FormEvent, packageId: string) => {
    e.preventDefault();
    setError(null);

    // Validate
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
        // Update existing add-on
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
        // Create new add-on
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
  };

  // Handle delete add-on
  const handleDeleteAddOn = async (addOnId: string) => {
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
        alert("Failed to delete add-on");
      }
    } catch (err) {
      console.error("Failed to delete add-on:", err);
      alert("An error occurred while deleting the add-on");
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Create Package Button */}
      {!isCreatingPackage && (
        <div className="flex justify-end">
          <Button onClick={handleCreatePackage}>Create Package</Button>
        </div>
      )}

      {/* Package Form Modal */}
      {isCreatingPackage && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingPackageId ? "Edit Package" : "Create New Package"}
          </h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSavePackage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-1">
                  Slug *
                </label>
                <input
                  id="slug"
                  type="text"
                  value={packageForm.slug}
                  onChange={(e) => setPackageForm({ ...packageForm, slug: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e-g-romantic-sunset"
                  disabled={isSaving}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase with hyphens only</p>
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={packageForm.title}
                  onChange={(e) => setPackageForm({ ...packageForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Romantic Sunset"
                  disabled={isSaving}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description *
              </label>
              <textarea
                id="description"
                value={packageForm.description}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="A beautiful sunset ceremony..."
                disabled={isSaving}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="priceCents" className="block text-sm font-medium mb-1">
                  Price (cents) *
                </label>
                <input
                  id="priceCents"
                  type="number"
                  value={packageForm.priceCents}
                  onChange={(e) => setPackageForm({ ...packageForm, priceCents: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50000 = $500.00"
                  min="0"
                  disabled={isSaving}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {packageForm.priceCents && !isNaN(parseInt(packageForm.priceCents, 10))
                    ? formatPrice(parseInt(packageForm.priceCents, 10))
                    : "Enter price in cents"}
                </p>
              </div>
              <div>
                <label htmlFor="photoUrl" className="block text-sm font-medium mb-1">
                  Photo URL
                </label>
                <input
                  id="photoUrl"
                  type="url"
                  value={packageForm.photoUrl}
                  onChange={(e) => setPackageForm({ ...packageForm, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/photo.jpg"
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingPackageId ? "Update Package" : "Create Package"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreatingPackage(false);
                  resetPackageForm();
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Packages Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Packages</h2>
        {packages.length === 0 ? (
          <p className="text-gray-500">No packages yet. Create your first package above.</p>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="border border-gray-200 rounded-lg p-4">
                {/* Package Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{pkg.title}</h3>
                      <span className="text-sm text-gray-500">({pkg.slug})</span>
                    </div>
                    <p className="text-gray-600 mt-1">{pkg.description}</p>
                    <div className="text-lg font-semibold text-blue-600 mt-2">
                      {formatPrice(pkg.priceCents)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleEditPackage(pkg)}
                      className="text-sm"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Add-ons Section */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">
                      Add-ons ({pkg.addOns.length})
                    </h4>
                    <button
                      onClick={() => {
                        if (expandedPackageId === pkg.id) {
                          setExpandedPackageId(null);
                        } else {
                          setExpandedPackageId(pkg.id);
                        }
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {expandedPackageId === pkg.id ? "Hide" : "Show"}
                    </button>
                  </div>

                  {expandedPackageId === pkg.id && (
                    <div className="space-y-3">
                      {/* Add-on Form */}
                      {isAddingAddOn === pkg.id && (
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h5 className="font-medium mb-3">
                            {editingAddOnId ? "Edit Add-on" : "New Add-on"}
                          </h5>
                          {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                              {error}
                            </div>
                          )}
                          <form
                            onSubmit={(e) => handleSaveAddOn(e, pkg.id)}
                            className="space-y-3"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label htmlFor="addOnTitle" className="block text-sm font-medium mb-1">
                                  Title *
                                </label>
                                <input
                                  id="addOnTitle"
                                  type="text"
                                  value={addOnForm.title}
                                  onChange={(e) =>
                                    setAddOnForm({ ...addOnForm, title: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Extra photography"
                                  disabled={isSaving}
                                  required
                                />
                              </div>
                              <div>
                                <label htmlFor="addOnPrice" className="block text-sm font-medium mb-1">
                                  Price (cents) *
                                </label>
                                <input
                                  id="addOnPrice"
                                  type="number"
                                  value={addOnForm.priceCents}
                                  onChange={(e) =>
                                    setAddOnForm({ ...addOnForm, priceCents: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="10000"
                                  min="0"
                                  disabled={isSaving}
                                  required
                                />
                              </div>
                              <div>
                                <label htmlFor="addOnPhoto" className="block text-sm font-medium mb-1">
                                  Photo URL
                                </label>
                                <input
                                  id="addOnPhoto"
                                  type="url"
                                  value={addOnForm.photoUrl}
                                  onChange={(e) =>
                                    setAddOnForm({ ...addOnForm, photoUrl: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="https://..."
                                  disabled={isSaving}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" disabled={isSaving} className="text-sm">
                                {isSaving ? "Saving..." : editingAddOnId ? "Update" : "Add"}
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                  setIsAddingAddOn(null);
                                  setEditingAddOnId(null);
                                  resetAddOnForm();
                                }}
                                disabled={isSaving}
                                className="text-sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Add Add-on Button */}
                      {!isAddingAddOn && (
                        <Button
                          variant="secondary"
                          onClick={() => handleAddAddOn(pkg.id)}
                          className="text-sm"
                        >
                          Add Add-on
                        </Button>
                      )}

                      {/* Add-ons List */}
                      {pkg.addOns.length > 0 && (
                        <div className="space-y-2">
                          {pkg.addOns.map((addOn) => (
                            <div
                              key={addOn.id}
                              className="flex justify-between items-center bg-white p-3 rounded border border-gray-200"
                            >
                              <div>
                                <div className="font-medium">{addOn.title}</div>
                                <div className="text-sm text-blue-600">
                                  {formatPrice(addOn.priceCents)}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditAddOn(addOn)}
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteAddOn(addOn.id)}
                                  className="text-sm text-red-600 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {pkg.addOns.length === 0 && !isAddingAddOn && (
                        <p className="text-sm text-gray-500">No add-ons yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
