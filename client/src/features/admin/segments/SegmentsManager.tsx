import { useState, useEffect, useCallback } from "react";
import type { SegmentDto } from "@macon/contracts";
import { api } from "@/lib/api";
import { SegmentForm } from "./SegmentForm";
import { SegmentsList } from "./SegmentsList";
import { CreateSegmentButton } from "./CreateSegmentButton";
import { SuccessMessage } from "../packages/SuccessMessage";
import { useSuccessMessage } from "../packages/hooks/useSuccessMessage";
import { useSegmentManager } from "./hooks/useSegmentManager";

export function SegmentsManager() {
  const [segments, setSegments] = useState<SegmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { successMessage, showSuccess } = useSuccessMessage();

  const fetchSegments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.tenantAdminGetSegments();
      if (result.status === 200) {
        // Sort segments by sortOrder ascending
        const sortedSegments = [...result.body].sort((a, b) => a.sortOrder - b.sortOrder);
        setSegments(sortedSegments);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const {
    isCreatingSegment,
    editingSegmentId,
    isSaving,
    error,
    segmentForm,
    setSegmentForm,
    handleCreateSegment,
    handleEditSegment,
    handleSaveSegment,
    handleDeleteSegment,
    handleCancelSegmentForm,
  } = useSegmentManager({ onSegmentsChange: fetchSegments, showSuccess });

  return (
    <div className="space-y-6">
      {successMessage && <SuccessMessage message={successMessage} />}

      {!isCreatingSegment && <CreateSegmentButton onClick={handleCreateSegment} />}

      {isCreatingSegment && (
        <SegmentForm
          segmentForm={segmentForm}
          editingSegmentId={editingSegmentId}
          isSaving={isSaving}
          error={error}
          onFormChange={setSegmentForm}
          onSubmit={handleSaveSegment}
          onCancel={handleCancelSegmentForm}
        />
      )}

      <SegmentsList
        segments={segments}
        onEdit={handleEditSegment}
        onDelete={handleDeleteSegment}
        isLoading={isLoading}
      />
    </div>
  );
}
