import { Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { PackageFormProps } from "./types";

export function PackageForm({
  packageForm,
  editingPackageId,
  isSaving,
  error,
  onFormChange,
  onSubmit,
  onCancel,
}: PackageFormProps) {
  const isValidSlug = (slug: string): boolean => {
    return /^[a-z0-9-]+$/.test(slug);
  };

  return (
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

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-lavender-100 text-lg">
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
              className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
              required
            />
            <p className="text-base text-lavender-200">Lowercase with hyphens only</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-lavender-100 text-lg">
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
              className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-lavender-100 text-lg">
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
            className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priceCents" className="text-lavender-100 text-lg">
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
              className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
              required
            />
            <p className="text-base text-lavender-200">
              {packageForm.priceCents && !isNaN(parseInt(packageForm.priceCents, 10))
                ? formatCurrency(parseInt(packageForm.priceCents, 10))
                : "Enter price in cents (e.g., 50000 = $500.00)"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoUrl" className="text-lavender-100 text-lg">
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
              className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-lavender-500 hover:bg-lavender-600 text-lg h-12 px-6"
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
            className="border-navy-600 text-lavender-100 hover:bg-navy-700 text-lg h-12 px-6"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
