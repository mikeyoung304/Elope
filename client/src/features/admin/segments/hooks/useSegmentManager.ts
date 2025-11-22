import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type {
  SegmentDto,
  CreateSegmentDto,
  UpdateSegmentDto,
} from "@macon/contracts";
import type { SegmentFormData } from "../../types";

interface UseSegmentManagerProps {
  onSegmentsChange: () => void;
  showSuccess: (message: string) => void;
}

export function useSegmentManager({ onSegmentsChange, showSuccess }: UseSegmentManagerProps) {
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [segmentForm, setSegmentForm] = useState<SegmentFormData>({
    slug: "",
    name: "",
    heroTitle: "",
    heroSubtitle: "",
    heroImage: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    sortOrder: "0",
    active: true,
  });

  // Validate slug format
  const isValidSlug = (slug: string): boolean => {
    return /^[a-z0-9-]+$/.test(slug);
  };

  // Auto-generate slug from name (kebab-case)
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
  };

  // Reset form
  const resetSegmentForm = useCallback(() => {
    setSegmentForm({
      slug: "",
      name: "",
      heroTitle: "",
      heroSubtitle: "",
      heroImage: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      sortOrder: "0",
      active: true,
    });
    setError(null);
  }, []);

  // Segment handlers
  const handleCreateSegment = useCallback(() => {
    resetSegmentForm();
    setIsCreatingSegment(true);
    setEditingSegmentId(null);
  }, [resetSegmentForm]);

  const handleEditSegment = useCallback((segment: SegmentDto) => {
    setSegmentForm({
      slug: segment.slug,
      name: segment.name,
      heroTitle: segment.heroTitle,
      heroSubtitle: segment.heroSubtitle || "",
      heroImage: segment.heroImage || "",
      description: segment.description || "",
      metaTitle: segment.metaTitle || "",
      metaDescription: segment.metaDescription || "",
      sortOrder: segment.sortOrder.toString(),
      active: segment.active,
    });
    setEditingSegmentId(segment.id);
    setIsCreatingSegment(true);
  }, []);

  const handleSaveSegment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!segmentForm.slug || !segmentForm.name || !segmentForm.heroTitle) {
      setError("Slug, Name, and Hero Title are required");
      return;
    }

    // Validate slug format
    if (!isValidSlug(segmentForm.slug)) {
      setError("Slug must be lowercase with hyphens only (no spaces)");
      return;
    }

    // Validate sortOrder
    const sortOrder = parseInt(segmentForm.sortOrder, 10);
    if (isNaN(sortOrder) || sortOrder < 0) {
      setError("Sort Order must be a number >= 0");
      return;
    }

    setIsSaving(true);

    try {
      if (editingSegmentId) {
        // Update existing segment
        const updateData: UpdateSegmentDto = {
          slug: segmentForm.slug,
          name: segmentForm.name,
          heroTitle: segmentForm.heroTitle,
          heroSubtitle: segmentForm.heroSubtitle || undefined,
          heroImage: segmentForm.heroImage || undefined,
          description: segmentForm.description || undefined,
          metaTitle: segmentForm.metaTitle || undefined,
          metaDescription: segmentForm.metaDescription || undefined,
          sortOrder,
          active: segmentForm.active,
        };

        const result = await api.tenantAdminUpdateSegment({
          params: { id: editingSegmentId },
          body: updateData,
        });

        if (result.status === 200) {
          showSuccess("Segment updated successfully");
          setIsCreatingSegment(false);
          resetSegmentForm();
          onSegmentsChange();
        } else {
          setError("Failed to update segment");
        }
      } else {
        // Create new segment
        const createData: CreateSegmentDto = {
          slug: segmentForm.slug,
          name: segmentForm.name,
          heroTitle: segmentForm.heroTitle,
          heroSubtitle: segmentForm.heroSubtitle || undefined,
          heroImage: segmentForm.heroImage || undefined,
          description: segmentForm.description || undefined,
          metaTitle: segmentForm.metaTitle || undefined,
          metaDescription: segmentForm.metaDescription || undefined,
          sortOrder,
          active: segmentForm.active,
        };

        const result = await api.tenantAdminCreateSegment({
          body: createData,
        });

        if (result.status === 200) {
          showSuccess("Segment created successfully");
          setIsCreatingSegment(false);
          resetSegmentForm();
          onSegmentsChange();
        } else {
          setError("Failed to create segment");
        }
      }
    } catch (err) {
      console.error("Failed to save segment:", err);
      setError("An error occurred while saving the segment");
    } finally {
      setIsSaving(false);
    }
  }, [segmentForm, editingSegmentId, showSuccess, resetSegmentForm, onSegmentsChange]);

  const handleDeleteSegment = useCallback(async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this segment? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await api.tenantAdminDeleteSegment({
        params: { id },
        body: undefined,
      });

      if (result.status === 204) {
        showSuccess("Segment deleted successfully");
        onSegmentsChange();
      } else {
        alert("Failed to delete segment");
      }
    } catch (err) {
      console.error("Failed to delete segment:", err);
      alert("An error occurred while deleting the segment");
    }
  }, [showSuccess, onSegmentsChange]);

  const handleCancelSegmentForm = useCallback(() => {
    setIsCreatingSegment(false);
    resetSegmentForm();
  }, [resetSegmentForm]);

  // Auto-generate slug from name when creating (not editing)
  const handleNameChange = useCallback((name: string) => {
    setSegmentForm(prev => {
      const newForm = { ...prev, name };
      // Only auto-generate slug when creating (not editing)
      if (!editingSegmentId) {
        newForm.slug = generateSlug(name);
      }
      return newForm;
    });
  }, [editingSegmentId]);

  return {
    // State
    isCreatingSegment,
    editingSegmentId,
    isSaving,
    error,
    segmentForm,

    // Actions
    setSegmentForm,
    handleCreateSegment,
    handleEditSegment,
    handleSaveSegment,
    handleDeleteSegment,
    handleCancelSegmentForm,
    handleNameChange,
  };
}
