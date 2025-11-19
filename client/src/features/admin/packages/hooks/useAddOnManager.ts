import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import type {
  AddOnDto,
  CreateAddOnDto,
  UpdateAddOnDto,
} from "@elope/contracts";
import type { AddOnFormData } from "../../types";

interface UseAddOnManagerProps {
  onPackagesChange: () => void;
  showSuccess: (message: string) => void;
}

export function useAddOnManager({ onPackagesChange, showSuccess }: UseAddOnManagerProps) {
  const [isAddingAddOn, setIsAddingAddOn] = useState<string | null>(null);
  const [editingAddOnId, setEditingAddOnId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<Array<{ id: string; name: string; active: boolean }>>([]);

  const [addOnForm, setAddOnForm] = useState<AddOnFormData>({
    title: "",
    priceCents: "",
    photoUrl: "",
    segmentId: "",
  });

  // Fetch segments
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const result = await api.tenantAdminGetSegments();
        if (result.status === 200) {
          setSegments(result.body);
        }
      } catch (err) {
        // Silent fail - segments are optional
      }
    };
    fetchSegments();
  }, []);

  // Reset form
  const resetAddOnForm = useCallback(() => {
    setAddOnForm({
      title: "",
      priceCents: "",
      photoUrl: "",
      segmentId: "",
    });
    setError(null);
  }, []);

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
      segmentId: addOn.segmentId || "",
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
          segmentId: addOnForm.segmentId || undefined,
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
          segmentId: addOnForm.segmentId || undefined,
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
        alert("Failed to delete add-on");
      }
    } catch (err) {
      console.error("Failed to delete add-on:", err);
      alert("An error occurred while deleting the add-on");
    }
  }, [showSuccess, onPackagesChange]);

  const handleCancelAddOn = useCallback(() => {
    setIsAddingAddOn(null);
    setEditingAddOnId(null);
    resetAddOnForm();
  }, [resetAddOnForm]);

  return {
    // State
    isAddingAddOn,
    editingAddOnId,
    isSaving,
    error,
    addOnForm,
    segments,

    // Actions
    setAddOnForm,
    handleStartAddingAddOn,
    handleEditAddOn,
    handleSaveAddOn,
    handleDeleteAddOn,
    handleCancelAddOn,
  };
}
