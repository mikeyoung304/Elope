import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PackageFormData } from "../hooks/usePackageForm";
import type { SegmentDto } from "@macon/contracts";

interface OrganizationSectionProps {
  form: PackageFormData;
  setForm: (form: PackageFormData) => void;
  segments: SegmentDto[];
  isLoadingSegments: boolean;
  isSaving: boolean;
}

/**
 * OrganizationSection Component
 *
 * Handles the tier/segment organization fields for the package form:
 * - Segment (business category) dropdown
 * - Tier/Grouping text input (e.g., "Solo", "Couple", "Group")
 * - Display order number
 */
export function OrganizationSection({
  form,
  setForm,
  segments,
  isLoadingSegments,
  isSaving,
}: OrganizationSectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <h3 className="text-lg font-medium text-white/90">Organization</h3>

      {/* Segment Dropdown */}
      <div className="space-y-2">
        <Label htmlFor="segmentId" className="text-white/90">
          Business Category
        </Label>
        <Select
          value={form.segmentId || "none"}
          onValueChange={(value) =>
            setForm({ ...form, segmentId: value === "none" ? "" : value })
          }
          disabled={isSaving || isLoadingSegments}
        >
          <SelectTrigger
            id="segmentId"
            className="bg-macon-navy-900 border-white/20 text-white h-12"
          >
            <SelectValue placeholder="Select a category (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {segments.map((seg) => (
              <SelectItem key={seg.id} value={seg.id}>
                {seg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-white/50">
          Assign this package to a business category
        </p>
      </div>

      {/* Tier/Grouping Text Input */}
      <div className="space-y-2">
        <Label htmlFor="grouping" className="text-white/90">
          Tier/Grouping
        </Label>
        <Input
          id="grouping"
          type="text"
          value={form.grouping}
          onChange={(e) => setForm({ ...form, grouping: e.target.value })}
          placeholder="e.g., Solo, Couple, Group, Budget, Premium"
          maxLength={100}
          disabled={isSaving}
          className="bg-macon-navy-900 border-white/20 text-white placeholder:text-white/50 focus:border-white/30 h-12"
        />
        <p className="text-sm text-white/50">
          Packages with the same grouping appear together on your storefront
        </p>
      </div>

      {/* Display Order Number */}
      <div className="space-y-2">
        <Label htmlFor="groupingOrder" className="text-white/90">
          Display Order
        </Label>
        <Input
          id="groupingOrder"
          type="number"
          value={form.groupingOrder}
          onChange={(e) => setForm({ ...form, groupingOrder: e.target.value })}
          placeholder="1"
          min="0"
          max="1000"
          disabled={isSaving}
          className="bg-macon-navy-900 border-white/20 text-white placeholder:text-white/50 focus:border-white/30 h-12 w-32"
        />
        <p className="text-sm text-white/50">
          Lower numbers appear first within the tier
        </p>
      </div>
    </div>
  );
}
