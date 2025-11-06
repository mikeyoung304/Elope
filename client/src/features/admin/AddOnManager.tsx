import { Plus, Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import type { AddOnManagerProps } from "./types";

export function AddOnManager({
  package: pkg,
  isAddingAddOn,
  editingAddOnId,
  addOnForm,
  isSaving,
  error,
  onFormChange,
  onSubmit,
  onCancel,
  onEdit,
  onDelete,
  onStartAdding,
}: AddOnManagerProps) {
  return (
    <div className="space-y-3">
      {/* Add-on Form */}
      {isAddingAddOn && (
        <div className="bg-navy-800 p-4 rounded-lg space-y-3 border border-navy-600">
          <h5 className="font-medium text-lg text-lavender-50">
            {editingAddOnId ? "Edit Add-on" : "New Add-on"}
          </h5>

          {error && (
            <div className="flex items-center gap-2 p-3 border border-navy-600 bg-navy-700 rounded">
              <AlertCircle className="w-4 h-4 text-lavender-200" />
              <span className="text-base text-lavender-100">{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="addOnTitle" className="text-base text-lavender-100">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="addOnTitle"
                  type="text"
                  value={addOnForm.title}
                  onChange={(e) =>
                    onFormChange({ ...addOnForm, title: e.target.value })
                  }
                  placeholder="Extra photography"
                  disabled={isSaving}
                  className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addOnPrice" className="text-base text-lavender-100">
                  Price (cents) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="addOnPrice"
                  type="number"
                  value={addOnForm.priceCents}
                  onChange={(e) =>
                    onFormChange({ ...addOnForm, priceCents: e.target.value })
                  }
                  placeholder="10000"
                  min="0"
                  disabled={isSaving}
                  className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addOnPhoto" className="text-base text-lavender-100">
                  Photo URL
                </Label>
                <Input
                  id="addOnPhoto"
                  type="url"
                  value={addOnForm.photoUrl}
                  onChange={(e) =>
                    onFormChange({ ...addOnForm, photoUrl: e.target.value })
                  }
                  placeholder="https://..."
                  disabled={isSaving}
                  className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-lavender-500 hover:bg-lavender-600 text-base h-10 px-4"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSaving ? "Saving..." : editingAddOnId ? "Update" : "Add"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
                className="border-navy-600 text-lavender-100 hover:bg-navy-700 text-base h-10 px-4"
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
          variant="outline"
          onClick={onStartAdding}
          className="border-navy-600 text-lavender-300 hover:bg-navy-700 text-base h-10 px-4"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Add-on
        </Button>
      )}

      {/* Add-ons List */}
      {pkg.addOns.length > 0 && (
        <div className="space-y-2">
          {pkg.addOns.map((addOn) => (
            <div
              key={addOn.id}
              className="flex justify-between items-center bg-navy-800 p-3 rounded border border-navy-600 hover:border-navy-500"
            >
              <div>
                <div className="font-medium text-lg text-lavender-50">{addOn.title}</div>
                <div className="text-lg text-lavender-300">
                  {formatCurrency(addOn.priceCents)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(addOn)}
                  className="text-lavender-300 hover:bg-navy-700"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(addOn.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pkg.addOns.length === 0 && !isAddingAddOn && (
        <p className="text-base text-lavender-100">No add-ons yet</p>
      )}
    </div>
  );
}
