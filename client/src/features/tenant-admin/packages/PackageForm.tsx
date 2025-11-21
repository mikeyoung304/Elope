import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorSummary, type FormError } from "@/components/ui/ErrorSummary";
import { formatCurrency } from "@/lib/utils";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
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
  const [validationErrors, setValidationErrors] = useState<FormError[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Track initial form state for unsaved changes detection
  const [initialForm, setInitialForm] = useState<PackageFormData>(form);

  // Calculate if form has unsaved changes
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  // Enable unsaved changes warning
  useUnsavedChanges({
    isDirty,
    message: "You have unsaved package changes. Leave anyway?",
    enabled: true
  });

  // Validate form on blur
  const validateField = (field: keyof PackageFormData, value: string | boolean) => {
    const errors: FormError[] = [];
    const newFieldErrors = { ...fieldErrors };

    if (field === 'title' && typeof value === 'string') {
      if (!value.trim()) {
        errors.push({ field: 'title', message: 'Package title is required' });
        newFieldErrors.title = 'Package title is required';
      } else {
        delete newFieldErrors.title;
      }
    }

    if (field === 'description' && typeof value === 'string') {
      if (!value.trim()) {
        errors.push({ field: 'description', message: 'Package description is required' });
        newFieldErrors.description = 'Package description is required';
      } else {
        delete newFieldErrors.description;
      }
    }

    if (field === 'priceCents' && typeof value === 'string') {
      if (!value) {
        errors.push({ field: 'priceCents', message: 'Price is required' });
        newFieldErrors.priceCents = 'Price is required';
      } else if (parseInt(value, 10) < 0) {
        errors.push({ field: 'priceCents', message: 'Price must be a positive number' });
        newFieldErrors.priceCents = 'Price must be a positive number';
      } else {
        delete newFieldErrors.priceCents;
      }
    }

    setFieldErrors(newFieldErrors);
    return errors;
  };

  // Validate entire form before submit
  const validateForm = () => {
    const errors: FormError[] = [];

    if (!form.title.trim()) {
      errors.push({ field: 'title', message: 'Package title is required' });
    }

    if (!form.description.trim()) {
      errors.push({ field: 'description', message: 'Package description is required' });
    }

    if (!form.priceCents) {
      errors.push({ field: 'priceCents', message: 'Price is required' });
    } else if (parseInt(form.priceCents, 10) < 0) {
      errors.push({ field: 'priceCents', message: 'Price must be a positive number' });
    }

    if (form.minLeadDays && parseInt(form.minLeadDays, 10) < 0) {
      errors.push({ field: 'minLeadDays', message: 'Min lead days must be a positive number' });
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    onSubmit(e);
  };

  // Show success message after save (when isSaving changes from true to false and no error)
  useEffect(() => {
    if (!isSaving && !error && validationErrors.length === 0) {
      setShowSuccess(true);
      // Reset initial form to current form after successful save (clear dirty state)
      setInitialForm(form);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, error, validationErrors.length, form]);

  // Update initial form when editing a different package
  useEffect(() => {
    setInitialForm(form);
  }, [editingPackageId]);

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

      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <h2 className="text-2xl font-semibold mb-4 text-macon-navy-50">
          {editingPackageId ? "Edit Package" : "Create New Package"}
        </h2>

      {/* Success Message */}
      {showSuccess && (
        <div role="status" className="flex items-center gap-2 p-4 mb-4 bg-success-50 border-2 border-success-600 rounded-lg">
          <CheckCircle className="w-5 h-5 text-success-700" />
          <span className="text-base text-success-800 font-medium">
            Package {editingPackageId ? 'updated' : 'created'} successfully!
          </span>
        </div>
      )}

      {/* Validation Errors */}
      <ErrorSummary
        errors={validationErrors}
        onDismiss={() => setValidationErrors([])}
      />

      {/* Server Error */}
      {error && (
        <div role="alert" className="flex items-center gap-2 p-4 mb-4 border border-macon-navy-600 bg-macon-navy-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-macon-navy-200" />
          <span className="text-base text-macon-navy-100">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-macon-navy-100 text-lg">
            Title <span className="text-red-400">*</span>
          </Label>
          <Input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              // Clear error when user starts typing
              if (fieldErrors.title) {
                const { title, ...rest } = fieldErrors;
                setFieldErrors(rest);
              }
            }}
            onBlur={(e) => validateField('title', e.target.value)}
            placeholder="Romantic Sunset Package"
            disabled={isSaving}
            className={`bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12 ${
              fieldErrors.title ? 'border-danger-600' : ''
            }`}
            aria-invalid={!!fieldErrors.title}
            aria-describedby={fieldErrors.title ? 'title-error' : undefined}
            required
          />
          {fieldErrors.title && (
            <p id="title-error" className="text-sm text-danger-700 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {fieldErrors.title}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-macon-navy-100 text-lg">
            Description <span className="text-red-400">*</span>
          </Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => {
              setForm({ ...form, description: e.target.value });
              if (fieldErrors.description) {
                const { description, ...rest } = fieldErrors;
                setFieldErrors(rest);
              }
            }}
            onBlur={(e) => validateField('description', e.target.value)}
            rows={3}
            placeholder="A beautiful sunset ceremony..."
            disabled={isSaving}
            className={`bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg ${
              fieldErrors.description ? 'border-danger-600' : ''
            }`}
            aria-invalid={!!fieldErrors.description}
            aria-describedby={fieldErrors.description ? 'description-error' : undefined}
            required
          />
          {fieldErrors.description && (
            <p id="description-error" className="text-sm text-danger-700 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {fieldErrors.description}
            </p>
          )}
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
              onChange={(e) => {
                setForm({ ...form, priceCents: e.target.value });
                if (fieldErrors.priceCents) {
                  const { priceCents, ...rest } = fieldErrors;
                  setFieldErrors(rest);
                }
              }}
              onBlur={(e) => validateField('priceCents', e.target.value)}
              placeholder="50000"
              min="0"
              disabled={isSaving}
              className={`bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12 ${
                fieldErrors.priceCents ? 'border-danger-600' : ''
              }`}
              aria-invalid={!!fieldErrors.priceCents}
              aria-describedby={fieldErrors.priceCents ? 'priceCents-error' : 'priceCents-help'}
              required
            />
            {fieldErrors.priceCents ? (
              <p id="priceCents-error" className="text-sm text-danger-700 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {fieldErrors.priceCents}
              </p>
            ) : (
              <p id="priceCents-help" className="text-base text-macon-navy-200">
                {form.priceCents && !isNaN(parseInt(form.priceCents, 10))
                  ? formatCurrency(parseInt(form.priceCents, 10))
                  : "Enter price in cents (e.g., 50000 = $500.00)"}
              </p>
            )}
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
    </>
  );
}
