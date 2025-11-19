import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { PackagePhoto } from "./hooks/usePhotoUpload";

interface PhotoDeleteDialogProps {
  photo: PackagePhoto | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * PhotoDeleteDialog Component
 *
 * Confirmation dialog for deleting a photo
 */
export function PhotoDeleteDialog({
  photo,
  isDeleting,
  onConfirm,
  onCancel
}: PhotoDeleteDialogProps) {
  return (
    <Dialog open={!!photo} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-macon-navy-800 border-macon-navy-600">
        <DialogHeader>
          <DialogTitle className="text-macon-navy-50">Delete Photo</DialogTitle>
          <DialogDescription className="text-macon-navy-200">
            Are you sure you want to delete this photo? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {photo && (
          <div className="my-4">
            <img
              src={photo.url}
              alt="Photo to delete"
              className="w-full h-48 object-cover rounded border border-macon-navy-600"
            />
            <p className="text-sm text-macon-navy-200 mt-2 truncate">
              {photo.filename}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isDeleting}
            className="border-macon-navy-600 text-macon-navy-100 hover:bg-macon-navy-700"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Photo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
