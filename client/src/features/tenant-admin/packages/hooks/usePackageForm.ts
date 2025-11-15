import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { PackageDto } from "@elope/contracts";

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
      minLeadDays: (pkg as any).minLeadDays?.toString() || "7",
      isActive: (pkg as any).isActive !== false,
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
      const data = {
        title: form.title,
        description: form.description,
        priceCents: parseInt(form.priceCents, 10),
        minLeadDays: parseInt(form.minLeadDays, 10),
        isActive: form.isActive,
      };

      if (editingPackageId) {
        const result = await (api as any).tenantUpdatePackage({
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
        const result = await (api as any).tenantCreatePackage({
          body: data,
        });

        if (result.status === 200) {
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
