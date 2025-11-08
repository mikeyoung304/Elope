/**
 * Example usage and test scenarios for package photo API
 *
 * This file demonstrates how to use the package photo API service
 * in various real-world scenarios.
 *
 * NOT A JEST TEST FILE - Just examples for documentation
 */

import { packagePhotoApi, photoValidation, type PackagePhoto } from './package-photo-api';
import { ApiError } from './api-helpers';

/**
 * EXAMPLE 1: Basic photo upload
 */
async function exampleBasicUpload(packageId: string, file: File) {
  try {
    // Validate file before upload (optional but recommended)
    const validationError = photoValidation.validateFile(file);
    if (validationError) {
      console.error('Validation failed:', validationError);
      return;
    }

    // Upload photo
    const photo = await packagePhotoApi.uploadPhoto(packageId, file);
    console.log('Photo uploaded successfully:', photo);
    console.log('Access at:', photo.url);
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle specific error cases
      switch (error.statusCode) {
        case 401:
          console.error('Not authenticated - redirect to login');
          // window.location.href = '/login';
          break;
        case 413:
          console.error('File too large:', error.message);
          break;
        case 400:
          console.error('Validation error:', error.message);
          break;
        default:
          console.error('Upload failed:', error.message);
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * EXAMPLE 2: Upload with progress/loading UI
 */
async function exampleUploadWithUI(
  packageId: string,
  file: File,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  onSuccess: (photo: PackagePhoto) => void
) {
  setLoading(true);
  setError(null);

  try {
    const photo = await packagePhotoApi.uploadPhoto(packageId, file);
    onSuccess(photo);
  } catch (error) {
    if (error instanceof ApiError) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  } finally {
    setLoading(false);
  }
}

/**
 * EXAMPLE 3: Delete photo
 */
async function exampleDeletePhoto(packageId: string, filename: string) {
  try {
    await packagePhotoApi.deletePhoto(packageId, filename);
    console.log('Photo deleted successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === 404) {
        console.error('Photo not found');
      } else {
        console.error('Delete failed:', error.message);
      }
    }
  }
}

/**
 * EXAMPLE 4: Get package with photos and display
 */
async function exampleGetPackagePhotos(packageId: string) {
  try {
    const pkg = await packagePhotoApi.getPackageWithPhotos(packageId);

    console.log(`Package: ${pkg.title}`);
    console.log(`Photos: ${pkg.photos?.length || 0}`);

    pkg.photos?.forEach((photo, index) => {
      console.log(`  ${index + 1}. ${photo.url} (${photo.size} bytes)`);
    });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('Failed to fetch package:', error.message);
    }
  }
}

/**
 * EXAMPLE 5: Upload multiple photos with validation
 */
async function exampleUploadMultiple(packageId: string, files: File[]) {
  try {
    // First, check current photo count
    const pkg = await packagePhotoApi.getPackageWithPhotos(packageId);
    const currentCount = pkg.photos?.length || 0;

    // Check if we can upload all files
    const countError = photoValidation.validatePhotoCount(currentCount + files.length - 1);
    if (countError) {
      console.error(countError);
      return;
    }

    // Upload each file
    const results = [];
    for (const file of files) {
      const validationError = photoValidation.validateFile(file);
      if (validationError) {
        console.error(`Skipping ${file.name}: ${validationError}`);
        continue;
      }

      try {
        const photo = await packagePhotoApi.uploadPhoto(packageId, file);
        results.push({ success: true, photo });
        console.log(`Uploaded: ${file.name}`);
      } catch (error) {
        results.push({ success: false, error, filename: file.name });
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to upload photos:', error);
  }
}

/**
 * EXAMPLE 6: Check photo count before upload
 */
async function exampleCheckPhotoLimit(packageId: string, newFile: File) {
  try {
    // Get current package
    const pkg = await packagePhotoApi.getPackageWithPhotos(packageId);
    const currentCount = pkg.photos?.length || 0;

    // Check limit
    const countError = photoValidation.validatePhotoCount(currentCount);
    if (countError) {
      alert(countError);
      return;
    }

    // Proceed with upload
    const photo = await packagePhotoApi.uploadPhoto(packageId, newFile);
    console.log('Uploaded:', photo);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

/**
 * EXAMPLE 7: Error handling with toast notifications
 */
async function exampleWithToast(
  packageId: string,
  file: File,
  showToast: (message: string, type: 'success' | 'error') => void
) {
  try {
    const photo = await packagePhotoApi.uploadPhoto(packageId, file);
    showToast('Photo uploaded successfully!', 'success');
    return photo;
  } catch (error) {
    if (error instanceof ApiError) {
      showToast(error.message, 'error');
    } else {
      showToast('An unexpected error occurred', 'error');
    }
    return null;
  }
}

/**
 * EXAMPLE 8: Optimistic UI update
 */
async function exampleOptimisticUpdate(
  packageId: string,
  file: File,
  updateUI: (photos: PackagePhoto[]) => void,
  getCurrentPhotos: () => PackagePhoto[]
) {
  // Create temporary photo object for optimistic UI
  const tempPhoto: PackagePhoto = {
    url: URL.createObjectURL(file), // Temporary local URL
    filename: file.name,
    size: file.size,
    order: getCurrentPhotos().length,
  };

  // Update UI immediately
  updateUI([...getCurrentPhotos(), tempPhoto]);

  try {
    // Upload to server
    const realPhoto = await packagePhotoApi.uploadPhoto(packageId, file);

    // Replace temp photo with real photo
    const photos = getCurrentPhotos().map((p) =>
      p.filename === tempPhoto.filename ? realPhoto : p
    );
    updateUI(photos);

    // Clean up temp URL
    URL.revokeObjectURL(tempPhoto.url);
  } catch (error) {
    // Revert optimistic update
    const photos = getCurrentPhotos().filter((p) => p.filename !== tempPhoto.filename);
    updateUI(photos);

    // Clean up temp URL
    URL.revokeObjectURL(tempPhoto.url);

    throw error;
  }
}

/**
 * Type definitions for component usage
 */
export type PhotoUploadHandler = (packageId: string, file: File) => Promise<PackagePhoto | null>;
export type PhotoDeleteHandler = (packageId: string, filename: string) => Promise<void>;

/**
 * Utility: Convert file to base64 for preview
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Utility: Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
