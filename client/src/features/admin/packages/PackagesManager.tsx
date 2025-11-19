import type { PackageDto } from "@elope/contracts";
import { PackageForm } from "../PackageForm";
import { SuccessMessage } from "./SuccessMessage";
import { CreatePackageButton } from "./CreatePackageButton";
import { PackagesList } from "./PackagesList";
import { useSuccessMessage } from "./hooks/useSuccessMessage";
import { usePackageManager } from "./hooks/usePackageManager";
import { useAddOnManager } from "./hooks/useAddOnManager";

interface PackagesManagerProps {
  packages: PackageDto[];
  onPackagesChange: () => void;
}

export function PackagesManager({ packages, onPackagesChange }: PackagesManagerProps) {
  const { successMessage, showSuccess } = useSuccessMessage();

  const {
    isCreatingPackage,
    editingPackageId,
    isSaving: packageSaving,
    error: packageError,
    packageForm,
    segments,
    setPackageForm,
    handleCreatePackage,
    handleEditPackage,
    handleSavePackage,
    handleDeletePackage,
    handleCancelPackageForm,
  } = usePackageManager({ onPackagesChange, showSuccess });

  const {
    isAddingAddOn,
    editingAddOnId,
    isSaving: addOnSaving,
    error: addOnError,
    addOnForm,
    segments: addOnSegments,
    setAddOnForm,
    handleStartAddingAddOn,
    handleEditAddOn,
    handleSaveAddOn,
    handleDeleteAddOn,
    handleCancelAddOn,
  } = useAddOnManager({ onPackagesChange, showSuccess });

  return (
    <div className="space-y-6">
      {successMessage && <SuccessMessage message={successMessage} />}

      {!isCreatingPackage && <CreatePackageButton onClick={handleCreatePackage} />}

      {isCreatingPackage && (
        <PackageForm
          packageForm={packageForm}
          editingPackageId={editingPackageId}
          isSaving={packageSaving}
          error={packageError}
          segments={segments}
          onFormChange={setPackageForm}
          onSubmit={handleSavePackage}
          onCancel={handleCancelPackageForm}
        />
      )}

      <PackagesList
        packages={packages}
        onEditPackage={handleEditPackage}
        onDeletePackage={handleDeletePackage}
        onPackagesChange={onPackagesChange}
        isAddingAddOn={isAddingAddOn}
        editingAddOnId={editingAddOnId}
        addOnForm={addOnForm}
        isSaving={addOnSaving}
        error={addOnError}
        segments={addOnSegments}
        onAddOnFormChange={setAddOnForm}
        onSubmitAddOn={handleSaveAddOn}
        onCancelAddOn={handleCancelAddOn}
        onEditAddOn={handleEditAddOn}
        onDeleteAddOn={handleDeleteAddOn}
        onStartAddingAddOn={handleStartAddingAddOn}
      />
    </div>
  );
}
