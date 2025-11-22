import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { PackageDto } from "@macon/contracts";

export interface PackageFormData {
  title: string;
  description: string;
  priceCents: string;
  minLeadDays: string;
  isActive: boolean;
}

interface UsePackageFormProps {
  onSuccess: (message: string) => void;
  onPackagesChange: () => void;
}

export function usePackageForm({ onSuccess, onPackagesChange }: UsePackageFormProps) {
  const [form, setForm] = useState<PackageFormData>({
    title: "",
    description: "",
    priceCents: "",
    minLeadDays: "7",
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setForm({
      title: "",
      description: "",
      priceCents: "",
      minLeadDays: "7",
      isActive: true,
    });
    setError(null);
  }, []);

  const loadPackage = useCallback((pkg: PackageDto) => {
    setForm({
      title: pkg.title,
      description: pkg.description,
      priceCents: pkg.priceCents.toString(),
      // TODO: Add minLeadDays to backend schema
      minLeadDays: "7", // Default value until backend supports this field
      isActive: pkg.isActive !== false,
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!form.title || !form.description || !form.priceCents) {
      setError("Title, description, and price are required");
      return false;
    }

    const priceCents = parseInt(form.priceCents, 10);
    const minLeadDays = parseInt(form.minLeadDays, 10);

    if (isNaN(priceCents) || priceCents <= 0) {
      setError("Price must be a positive number");
      return false;
    }

    if (isNaN(minLeadDays) || minLeadDays < 0) {
      setError("Min lead days must be a non-negative number");
      return false;
    }

    return true;
  }, [form]);

  const submitForm = useCallback(async (editingPackageId: string | null) => {
    setError(null);

    if (!validateForm()) {
      return false;
    }

    setIsSaving(true);

    try {
      // Generate slug from title (lowercase, replace spaces with hyphens)
      const slug = form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const data = {
        slug,
        title: form.title,
        description: form.description,
        priceCents: parseInt(form.priceCents, 10),
      };

      if (editingPackageId) {
        const result = await api.tenantAdminUpdatePackage({
          params: { id: editingPackageId },
          body: data,
        });

        if (result.status === 200) {
          onSuccess("Package updated successfully");
          resetForm();
          onPackagesChange();
          return true;
        } else {
          setError("Failed to update package");
          return false;
        }
      } else {
        const result = await api.tenantAdminCreatePackage({
          body: data,
        });

        if (result.status === 201) {
          onSuccess("Package created successfully");
          resetForm();
          onPackagesChange();
          return true;
        } else {
          setError("Failed to create package");
          return false;
        }
      }
    } catch (err) {
      console.error("Failed to save package:", err);
      setError("An error occurred while saving the package");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [form, validateForm, onSuccess, resetForm, onPackagesChange]);

  return {
    form,
    setForm,
    isSaving,
    error,
    resetForm,
    loadPackage,
    submitForm,
  };
}
