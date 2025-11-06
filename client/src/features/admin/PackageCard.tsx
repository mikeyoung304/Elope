import { useMemo, useCallback } from "react";
import { Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { PackageCardProps } from "./types";

export function PackageCard({
  package: pkg,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddOnChange,
}: PackageCardProps) {
  const handleEdit = useCallback(() => {
    onEdit(pkg);
  }, [pkg, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(pkg.id);
  }, [pkg.id, onDelete]);

  const formattedPrice = useMemo(() => formatCurrency(pkg.priceCents), [pkg.priceCents]);

  return (
    <div className="border border-navy-600 rounded-lg p-4 space-y-4 hover:border-navy-500 transition-colors bg-navy-900">
      {/* Package Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-semibold text-lavender-50">{pkg.title}</h3>
            <Badge
              variant="outline"
              className="text-base border-navy-500 bg-navy-700 text-lavender-200"
            >
              {pkg.slug}
            </Badge>
          </div>
          <p className="text-lavender-100 text-lg mb-2">{pkg.description}</p>
          <div className="text-2xl font-semibold text-lavender-300">{formattedPrice}</div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="border-navy-600 text-lavender-300 hover:bg-navy-700"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="border-navy-600 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Add-ons Section */}
      <div className="pt-3 border-t border-navy-600">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 text-lg font-medium text-lavender-300 hover:text-lavender-200 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
          Add-ons ({pkg.addOns.length})
        </button>
      </div>
    </div>
  );
}
