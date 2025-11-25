import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { PackageFormProps, PackageFormData } from "./types";

export function PackageForm({
  packageForm,
  editingPackageId,
  isSaving,
  error,
  segments,
  onFormChange,
  onSubmit,
  onCancel,
}: PackageFormProps) {
  const isValidSlug = (slug: string): boolean => {
    return /^[a-z0-9-]+$/.test(slug);
  };

  // Track initial form state for unsaved changes detection
  const [initialForm, setInitialForm] = useState<PackageFormData>(packageForm);

  // Calculate if form has unsaved changes
  const isDirty = JSON.stringify(packageForm) !== JSON.stringify(initialForm);

  // Enable unsaved changes warning
  useUnsavedChanges({
    isDirty,
    message: "You have unsaved package changes. Leave anyway?",
    enabled: true
  });

  // Update initial form when editing a different package or after successful save
  useEffect(() => {
    setInitialForm(packageForm);
  }, [editingPackageId]);

  // Reset initial form after successful save (when isSaving goes from true to false with no error)
  useEffect(() => {
    if (!isSaving && !error) {
      setInitialForm(packageForm);
    }
  }, [isSaving, error, packageForm]);

  return (
    <>
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onCancel}
        className="mb-4 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="p-6 bg-macon-navy-800 border-white/20">
        <h2 className="text-2xl font-semibold mb-4 text-white">
          {editingPackageId ? "Edit Package" : "Create New Package"}
        </h2>

      {error && (
        <div role="alert" className="flex items-center gap-2 p-4 mb-4 border border-white/20 bg-macon-navy-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-white/70" />
          <span className="text-base text-white/90">{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-white/90 text-lg">
              Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="slug"
              type="text"
              value={packageForm.slug}
              onChange={(e) =>
                onFormChange({ ...packageForm, slug: e.target.value.toLowerCase() })
              }
              placeholder="romantic-sunset"
              disabled={isSaving}
              className="bg-macon-navy-900 border-white/20 text-white placeholder:text-white/50 focus:border-white/30 text-lg h-12"
              required
            />
            <p className="text-base text-white/70">Lowercase with hyphens only</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-white/90 text-lg">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              value={packageForm.title}
              onChange={(e) =>
                onFormChange({ ...packageForm, title: e.target.value })
              }
              placeholder="Romantic Sunset"
              disabled={isSaving}
              className="bg-macon-navy-900 border-white/20 text-white placeholder:text-white/50 focus:border-white/30 text-lg h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-white/90 text-lg">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={packageForm.description}
            onChange={(e) =>
              onFormChange({ ...packageForm, description: e.target.value })
            }
            rows={3}
            placeholder="A beautiful sunset ceremony..."
            disabled={isSaving}
            className="bg-macon-navy-900 border-white/20 text-white placeholder:text-white/50 focus:border-white/30 text-lg"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priceCents" className="text-white/90 text-lg">
              Price (cents) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="priceCents"
              type="number"
              value={packageForm.priceCents}
              onChange={(e) =>
                onFormChange({ ...packageForm, priceCents: e.target.value })
              }
              placeholder="50000"
              min="0"
              disabled={isSaving}
              className="bg-macon-navy-900 border-white/20 text-white placeholder:text-white/50 focus:border-white/30 text-lg h-12"
              required
            />
            <p className="text-base text-white/70">
              {packageForm.priceCents && !isNaN(parseInt(packageForm.priceCents, 10))
                ? formatCurrency(parseInt(packageForm.priceCents, 10))
                : "Enter price in cents (e.g., 50000 = $500.00)"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="photoUrl" className="text-white/90 text-lg">
              Photo URL
            </Label>
            <Input
              id="photoUrl"
              type="url"
              value={packageForm.photoUrl}
              onChange={(e) =>
                onFormChange({ ...packageForm, photoUrl: e.target.value })
              }
              placeholder="https://example.com/photo.jpg"
              disabled={isSaving}
              className="bg-macon-navy-900 border-white/20 text-white placeholder:text-white/50 focus:border-white/30 text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="segmentId" className="text-white/90 text-lg">
              Segment (Optional)
            </Label>
            <Select
              value={packageForm.segmentId || ""}
              onValueChange={(value) =>
                onFormChange({ ...packageForm, segmentId: value === "" ? "" : value })
              }
              disabled={isSaving}
            >
              <SelectTrigger className="bg-macon-navy-900 border-white/20 text-white h-12 text-lg">
                <SelectValue placeholder="No segment (General Catalog)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No segment (General Catalog)</SelectItem>
                {segments?.filter(s => s.active).map((segment) => (
                  <SelectItem key={segment.id} value={segment.id}>
                    {segment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-base text-white/70">
              Assign this package to a specific business segment
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-macon-navy hover:bg-macon-navy-dark text-lg h-12 px-6"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving
              ? "Saving..."
              : editingPackageId
              ? "Update Package"
              : "Create Package"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="border-white/20 text-white/90 hover:bg-macon-navy-700 text-lg h-12 px-6"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
    </>
  );
}
