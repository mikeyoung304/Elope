import { Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { PackageFormData } from "./hooks/usePackageForm";

interface PackageFormProps {
  form: PackageFormData;
  setForm: (form: PackageFormData) => void;
  isSaving: boolean;
  error: string | null;
  editingPackageId: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

/**
 * PackageForm Component
 *
 * Form for creating or editing a package
 */
export function PackageForm({
  form,
  setForm,
  isSaving,
  error,
  editingPackageId,
  onSubmit,
  onCancel
}: PackageFormProps) {
  return (
    <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
      <h2 className="text-2xl font-semibold mb-4 text-macon-navy-50">
        {editingPackageId ? "Edit Package" : "Create New Package"}
      </h2>

      {error && (
        <div role="alert" className="flex items-center gap-2 p-4 mb-4 border border-macon-navy-600 bg-macon-navy-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-macon-navy-200" />
          <span className="text-base text-macon-navy-100">{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-macon-navy-100 text-lg">
            Title <span className="text-red-400">*</span>
          </Label>
          <Input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Romantic Sunset Package"
            disabled={isSaving}
            className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-macon-navy-100 text-lg">
            Description <span className="text-red-400">*</span>
          </Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="A beautiful sunset ceremony..."
            disabled={isSaving}
            className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priceCents" className="text-macon-navy-100 text-lg">
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
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12"
              required
            />
            <p className="text-base text-macon-navy-200">
              {form.priceCents && !isNaN(parseInt(form.priceCents, 10))
                ? formatCurrency(parseInt(form.priceCents, 10))
                : "Enter price in cents (e.g., 50000 = $500.00)"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minLeadDays" className="text-macon-navy-100 text-lg">
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
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12"
            />
            <p className="text-base text-macon-navy-200">Days before event date required</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            disabled={isSaving}
            className="w-5 h-5 rounded border-macon-navy-600 bg-macon-navy-900 text-macon-navy-500 focus:ring-macon-navy-500"
          />
          <Label htmlFor="isActive" className="text-macon-navy-100 text-lg cursor-pointer">
            Active (available for booking)
          </Label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-macon-navy hover:bg-macon-navy-dark text-lg h-12 px-6"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving ? "Saving..." : editingPackageId ? "Update Package" : "Create Package"}
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
