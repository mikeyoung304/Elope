import { Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SegmentFormData } from "../types";

interface SegmentFormProps {
  segmentForm: SegmentFormData;
  editingSegmentId: string | null;
  isSaving: boolean;
  error: string | null;
  onFormChange: (form: SegmentFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const CharCount = ({ current, max }: { current: number; max: number }) => (
  <p className={cn(
    "text-sm",
    current > max ? "text-destructive" : "text-macon-navy-300"
  )}>
    {current} / {max} characters
  </p>
);

export function SegmentForm({
  segmentForm,
  editingSegmentId,
  isSaving,
  error,
  onFormChange,
  onSubmit,
  onCancel,
}: SegmentFormProps) {
  return (
    <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
      <h2 className="text-2xl font-semibold mb-4 text-macon-navy-50">
        {editingSegmentId ? "Edit Segment" : "Create Segment"}
      </h2>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 border border-macon-navy-600 bg-macon-navy-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-macon-navy-200" />
          <span className="text-base text-macon-navy-100">{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-macon-navy-100 text-lg">
              Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="slug"
              type="text"
              value={segmentForm.slug}
              onChange={(e) =>
                onFormChange({ ...segmentForm, slug: e.target.value.toLowerCase() })
              }
              placeholder="wellness-retreat"
              disabled={isSaving}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12"
              required
            />
            <p className="text-base text-macon-navy-200">
              Lowercase alphanumeric and hyphens only (e.g., 'wellness-retreat')
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-macon-navy-100 text-lg">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={segmentForm.name}
              onChange={(e) =>
                onFormChange({ ...segmentForm, name: e.target.value })
              }
              placeholder="Wellness Retreat"
              disabled={isSaving}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="heroTitle" className="text-macon-navy-100 text-lg">
              Hero Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="heroTitle"
              type="text"
              value={segmentForm.heroTitle}
              onChange={(e) =>
                onFormChange({ ...segmentForm, heroTitle: e.target.value })
              }
              placeholder="Welcome to Your Wellness Journey"
              disabled={isSaving}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroSubtitle" className="text-macon-navy-100 text-lg">
              Hero Subtitle
            </Label>
            <Input
              id="heroSubtitle"
              type="text"
              value={segmentForm.heroSubtitle}
              onChange={(e) =>
                onFormChange({ ...segmentForm, heroSubtitle: e.target.value })
              }
              placeholder="Transform your special day"
              disabled={isSaving}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="heroImage" className="text-macon-navy-100 text-lg">
              Hero Image URL
            </Label>
            <Input
              id="heroImage"
              type="url"
              value={segmentForm.heroImage}
              onChange={(e) =>
                onFormChange({ ...segmentForm, heroImage: e.target.value })
              }
              placeholder="https://example.com/hero.jpg"
              disabled={isSaving}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder" className="text-macon-navy-100 text-lg">
              Sort Order
            </Label>
            <Input
              id="sortOrder"
              type="number"
              value={segmentForm.sortOrder}
              onChange={(e) =>
                onFormChange({ ...segmentForm, sortOrder: parseInt(e.target.value, 10) || 0 })
              }
              placeholder="0"
              disabled={isSaving}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12"
            />
            <p className="text-base text-macon-navy-200">
              Lower numbers appear first in navigation
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-macon-navy-100 text-lg">
            Description
          </Label>
          <Textarea
            id="description"
            value={segmentForm.description}
            onChange={(e) =>
              onFormChange({ ...segmentForm, description: e.target.value })
            }
            rows={3}
            placeholder="A comprehensive description for SEO..."
            disabled={isSaving}
            className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle" className="text-macon-navy-100 text-lg">
              Meta Title
            </Label>
            <Input
              id="metaTitle"
              type="text"
              value={segmentForm.metaTitle}
              onChange={(e) =>
                onFormChange({ ...segmentForm, metaTitle: e.target.value })
              }
              placeholder="Wellness Retreat Packages | Your Company"
              disabled={isSaving}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12"
            />
            <CharCount current={segmentForm.metaTitle.length} max={60} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="metaDescription" className="text-macon-navy-100 text-lg">
            Meta Description
          </Label>
          <Textarea
            id="metaDescription"
            value={segmentForm.metaDescription}
            onChange={(e) =>
              onFormChange({ ...segmentForm, metaDescription: e.target.value })
            }
            rows={3}
            placeholder="Discover our wellness retreat packages..."
            disabled={isSaving}
            className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg"
          />
          <CharCount current={segmentForm.metaDescription.length} max={160} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={segmentForm.active}
              onChange={(e) =>
                onFormChange({ ...segmentForm, active: e.target.checked })
              }
              disabled={isSaving}
              className="w-4 h-4 text-macon-navy-500 bg-macon-navy-900 border-macon-navy-600 rounded focus:ring-macon-navy-500"
            />
            <Label htmlFor="active" className="text-macon-navy-100 text-lg cursor-pointer">
              Active
            </Label>
          </div>
          <p className="text-base text-macon-navy-200">
            Inactive segments are hidden from public view
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-macon-navy hover:bg-macon-navy-dark text-lg h-12 px-6"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving
              ? editingSegmentId
                ? "Updating..."
                : "Creating..."
              : editingSegmentId
              ? "Update Segment"
              : "Create Segment"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="border-macon-navy-600 text-macon-navy-100 hover:bg-macon-navy-700 text-lg h-12 px-6"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
