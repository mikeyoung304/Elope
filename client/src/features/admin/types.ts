/**
 * Shared types for admin components
 */

import type { PackageDto, AddOnDto } from "@elope/contracts";

export interface PackageFormData {
  slug: string;
  title: string;
  description: string;
  priceCents: string;
  photoUrl: string;
}

export interface AddOnFormData {
  title: string;
  priceCents: string;
  photoUrl: string;
}

export interface PackageCardProps {
  package: PackageDto;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (pkg: PackageDto) => void;
  onDelete: (packageId: string) => void;
  onAddOnChange: () => void;
}

export interface PackageFormProps {
  packageForm: PackageFormData;
  editingPackageId: string | null;
  isSaving: boolean;
  error: string | null;
  onFormChange: (form: PackageFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export interface AddOnManagerProps {
  package: PackageDto;
  isAddingAddOn: boolean;
  editingAddOnId: string | null;
  addOnForm: AddOnFormData;
  isSaving: boolean;
  error: string | null;
  onFormChange: (form: AddOnFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onEdit: (addOn: AddOnDto) => void;
  onDelete: (addOnId: string) => void;
  onStartAdding: () => void;
}
