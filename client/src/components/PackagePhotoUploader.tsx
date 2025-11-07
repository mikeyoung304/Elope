import { useState, useRef, useCallback } from "react";
import { Upload, Trash2, AlertCircle, CheckCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { baseUrl } from "@/lib/api";

/**
 * Package photo data structure
 */
export interface PackagePhoto {
  url: string;
  filename: string;
  size: number;
  order: number;
}

/**
 * Props for PackagePhotoUploader component
 */
export interface PackagePhotoUploaderProps {
  packageId: string;
  initialPhotos?: PackagePhoto[];
  onPhotosChange?: (photos: PackagePhoto[]) => void;
  tenantToken?: string; // Optional: if not provided, will use localStorage
}

/**
 * Photo upload result from API
 */
interface UploadResult {
  url: string;
  filename: string;
  size: number;
  order: number;
}

/**
 * Error response from API
 */
interface ApiErrorResponse {
  error: string;
  details?: any;
}

/**
 * PackagePhotoUploader Component
 *
 * Allows tenant admins to upload, view, and delete package photos (max 5)
 *
 * Features:
 * - Photo grid display (responsive)
 * - Upload button with file validation (5MB max, images only)
 * - Delete with confirmation dialog
 * - Loading states for upload/delete
 * - Error handling with user-friendly messages
 * - Success feedback
 */
export function PackagePhotoUploader({
  packageId,
  initialPhotos = [],
  onPhotosChange,
  tenantToken,
}: PackagePhotoUploaderProps) {
  const [photos, setPhotos] = useState<PackagePhoto[]>(initialPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackagePhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maximum photos allowed
  const MAX_PHOTOS = 5;

  // Maximum file size (5MB in bytes)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Allowed file types
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

  /**
   * Show success message temporarily
   */
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  /**
   * Update photos state and notify parent
   */
  const updatePhotos = useCallback((newPhotos: PackagePhoto[]) => {
    setPhotos(newPhotos);
    if (onPhotosChange) {
      onPhotosChange(newPhotos);
    }
  }, [onPhotosChange]);

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds maximum of 5MB (file is ${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed types: JPG, PNG, WebP, SVG`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);

    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input value to allow re-uploading same file
    event.target.value = '';

    // Check photo count
    if (photos.length >= MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos per package`);
      return;
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Upload file
    await uploadPhoto(file);
  };

  /**
   * Upload photo to server
   */
  const uploadPhoto = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('photo', file);

      // Get token from prop or localStorage
      const token = tenantToken || localStorage.getItem('tenantToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Upload to API
      const response = await fetch(`${baseUrl}/v1/tenant/admin/packages/${packageId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        // Parse error response
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ error: 'Upload failed' }));

        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Unauthorized: Please log in again');
        } else if (response.status === 403) {
          throw new Error('Forbidden: You do not have permission to upload photos to this package');
        } else if (response.status === 404) {
          throw new Error('Package not found');
        } else if (response.status === 413) {
          throw new Error('File too large (maximum 5MB)');
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Upload failed');
        } else {
          throw new Error(errorData.error || 'Upload failed');
        }
      }

      // Parse success response
      const uploadResult: UploadResult = await response.json();

      // Add photo to list
      const newPhotos = [...photos, uploadResult];
      updatePhotos(newPhotos);

      showSuccess('Photo uploaded successfully');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while uploading');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle delete button click
   */
  const handleDeleteClick = (photo: PackagePhoto) => {
    setDeleteTarget(photo);
  };

  /**
   * Confirm and execute delete
   */
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError(null);

    try {
      // Get token from prop or localStorage
      const token = tenantToken || localStorage.getItem('tenantToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Delete from API
      const response = await fetch(
        `${baseUrl}/v1/tenant/admin/packages/${packageId}/photos/${deleteTarget.filename}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Parse error response
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ error: 'Delete failed' }));

        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Unauthorized: Please log in again');
        } else if (response.status === 403) {
          throw new Error('Forbidden: You do not have permission to delete photos from this package');
        } else if (response.status === 404) {
          throw new Error('Photo not found');
        } else {
          throw new Error(errorData.error || 'Delete failed');
        }
      }

      // Remove photo from list
      const newPhotos = photos.filter(p => p.filename !== deleteTarget.filename);
      updatePhotos(newPhotos);

      showSuccess('Photo deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Cancel delete dialog
   */
  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  /**
   * Trigger file input click
   */
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 border border-lavender-600 bg-navy-700 rounded-lg">
          <CheckCircle className="w-5 h-5 text-lavender-300 flex-shrink-0" />
          <span className="text-lg font-medium text-lavender-100">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 border border-red-600 bg-navy-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
          <span className="text-base text-lavender-100">{error}</span>
        </div>
      )}

      <Card className="p-6 bg-navy-800 border-navy-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-lavender-50">
            Package Photos ({photos.length}/{MAX_PHOTOS})
          </h3>

          {/* Upload Button */}
          <Button
            onClick={triggerFileInput}
            disabled={isUploading || photos.length >= MAX_PHOTOS}
            className="bg-lavender-500 hover:bg-lavender-600 text-base h-10 px-4"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </>
            )}
          </Button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-navy-600 rounded-lg">
            <ImageIcon className="w-16 h-16 text-navy-500 mb-4" />
            <p className="text-lg text-lavender-100 text-center mb-2">No photos yet</p>
            <p className="text-base text-lavender-200 text-center mb-4">
              Upload up to {MAX_PHOTOS} photos (max 5MB each)
            </p>
            <Button
              onClick={triggerFileInput}
              disabled={isUploading}
              variant="outline"
              className="border-navy-600 text-lavender-100 hover:bg-navy-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Photo
            </Button>
          </div>
        ) : (
          // Photo grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.filename}
                className="relative group aspect-video bg-navy-700 border border-navy-600 rounded-lg overflow-hidden"
              >
                {/* Photo order badge */}
                <div className="absolute top-2 left-2 z-10 bg-navy-900/80 text-lavender-100 text-sm font-semibold px-2 py-1 rounded">
                  #{index + 1}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteClick(photo)}
                  className="absolute top-2 right-2 z-10 bg-red-600 hover:bg-red-700 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Photo image */}
                <img
                  src={photo.url}
                  alt={`Package photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Photo info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy-900/90 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-lavender-200 truncate">
                    {photo.filename}
                  </p>
                  <p className="text-xs text-lavender-300">
                    {(photo.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload hint */}
        {photos.length > 0 && photos.length < MAX_PHOTOS && (
          <p className="text-base text-lavender-200 mt-4">
            You can upload {MAX_PHOTOS - photos.length} more {photos.length === MAX_PHOTOS - 1 ? 'photo' : 'photos'}
          </p>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent className="bg-navy-800 border-navy-600">
          <DialogHeader>
            <DialogTitle className="text-lavender-50">Delete Photo</DialogTitle>
            <DialogDescription className="text-lavender-200">
              Are you sure you want to delete this photo? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="my-4">
              <img
                src={deleteTarget.url}
                alt="Photo to delete"
                className="w-full h-48 object-cover rounded border border-navy-600"
              />
              <p className="text-sm text-lavender-200 mt-2 truncate">
                {deleteTarget.filename}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={cancelDelete}
              variant="outline"
              disabled={isDeleting}
              className="border-navy-600 text-lavender-100 hover:bg-navy-700"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
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
    </div>
  );
}
