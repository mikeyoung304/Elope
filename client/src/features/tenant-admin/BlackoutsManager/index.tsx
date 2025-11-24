/**
 * BlackoutsManager Component (Refactored)
 *
 * Main orchestrator for blackout dates management.
 * Coordinates between smaller specialized components.
 * Manages blackout dates that prevent bookings on specific days.
 */

import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { BlackoutForm } from "./BlackoutForm";
import { BlackoutsList } from "./BlackoutsList";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { SuccessMessage } from "./SuccessMessage";
import { useBlackoutsManager } from "./useBlackoutsManager";
import type { BlackoutsManagerProps } from "./types";

export function BlackoutsManager({ blackouts, isLoading, onBlackoutsChange }: BlackoutsManagerProps) {
  const {
    // Form state
    newBlackoutDate,
    setNewBlackoutDate,
    newBlackoutReason,
    setNewBlackoutReason,
    isAdding,
    isDirty,

    // Dialog state
    deleteDialogOpen,
    setDeleteDialogOpen,
    blackoutToDelete,

    // Messages
    successMessage,

    // Actions
    handleAddBlackout,
    handleDeleteClick,
    confirmDelete,
    cancelDelete,
  } = useBlackoutsManager(onBlackoutsChange);

  // Enable unsaved changes warning
  useUnsavedChanges({
    isDirty,
    message: "You have unsaved blackout date information. Leave anyway?",
    enabled: true
  });

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <SuccessMessage message={successMessage} />

      {/* Add Blackout Form */}
      <BlackoutForm
        newBlackoutDate={newBlackoutDate}
        setNewBlackoutDate={setNewBlackoutDate}
        newBlackoutReason={newBlackoutReason}
        setNewBlackoutReason={setNewBlackoutReason}
        isAdding={isAdding}
        onSubmit={handleAddBlackout}
      />

      {/* Blackouts List */}
      <BlackoutsList
        blackouts={blackouts}
        isLoading={isLoading}
        onDeleteClick={handleDeleteClick}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        blackoutToDelete={blackoutToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}