import { useMemo, useCallback } from "react";
import { Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    <div className="border border-macon-navy-600 rounded-lg p-4 space-y-4 hover:border-macon-navy-500 transition-colors bg-macon-navy-900">
      {/* Package Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-semibold text-macon-navy-50">{pkg.title}</h3>
            <Badge
              variant="outline"
              className="text-base border-macon-navy-500 bg-macon-navy-700 text-macon-navy-200"
            >
              {pkg.slug}
            </Badge>
          </div>
          <p className="text-macon-navy-100 text-lg mb-2">{pkg.description}</p>
          <div className="text-2xl font-semibold text-macon-navy-300">{formattedPrice}</div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="border-macon-navy-600 text-macon-navy-300 hover:bg-macon-navy-700"
            aria-label={`Edit package: ${pkg.title}`}
            title="Edit package"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-macon-navy-600 text-destructive hover:bg-destructive/10"
                aria-label={`Delete package: ${pkg.title}`}
                title="Delete package"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{pkg.title}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the package
                  and all {pkg.addOns.length} associated add-on{pkg.addOns.length !== 1 ? 's' : ''}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Package
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Add-ons Section */}
      <div className="pt-3 border-t border-macon-navy-600">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 text-lg font-medium text-macon-navy-300 hover:text-macon-navy-200 transition-colors"
          aria-label={isExpanded ? `Collapse add-ons for ${pkg.title}` : `Expand add-ons for ${pkg.title}`}
          aria-expanded={isExpanded}
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
