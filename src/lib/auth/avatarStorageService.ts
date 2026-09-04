/**
 * MakersFlow Avatar Storage Service
 * Handles client-side validation, presigned URL generation via NestJS backend,
 * direct S3 binary upload without auth headers, and user profile synchronization.
 */

import { apiClient, ApiError } from "./apiClient";
import { customAuthService } from "./customAuthService";

export interface AvatarValidationResult {
  valid: boolean;
  error?: string;
}

export interface PresignedUploadUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export interface UploadAvatarResult {
  publicUrl: string;
  key: string;
}

// Allowed MIME types for avatars
export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Maximum avatar size: 5 MB (5 * 1024 * 1024 bytes)
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Validates selected avatar file against format and size constraints.
 * Must run BEFORE calling the backend upload-url endpoint.
 */
export function validateAvatarFile(file: File): AvatarValidationResult {
  if (!file) {
    return { valid: false, error: "No image file selected." };
  }

  // Verify format
  const fileType = (file.type || "").toLowerCase();
  const fileName = (file.name || "").toLowerCase();
  const matchesExtension =
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".webp") ||
    fileName.endsWith(".gif");

  const isAllowedType = ALLOWED_AVATAR_TYPES.includes(fileType) || matchesExtension;

  if (!isAllowedType) {
    return {
      valid: false,
      error: "Unsupported image format. Please select a JPEG, PNG, WEBP, or GIF image.",
    };
  }

  // Verify size
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Image size (${sizeInMB} MB) exceeds the 5 MB limit. Please select a smaller image.`,
    };
  }

  return { valid: true };
}

/**
 * Determines normalized MIME content-type from file metadata
 */
export function getNormalizedContentType(file: File): string {
  if (file.type && ALLOWED_AVATAR_TYPES.includes(file.type.toLowerCase())) {
    return file.type.toLowerCase();
  }
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export const avatarStorageService = {
  /**
   * Complete end-to-end avatar upload flow:
   * 1. Validate file (format + size)
   * 2. Request presigned upload URL from POST /storage/upload-url (JWT authenticated)
   * 3. Upload binary to S3 using PUT <uploadUrl> (WITHOUT Authorization header)
   * 4. Persist new avatar_url via PATCH /users/profile
   * 5. Return publicUrl and S3 key
   */
  async uploadAvatar(file: File): Promise<UploadAvatarResult> {
    // Step 1: Pre-upload client validation
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid avatar file.");
    }

    const contentType = getNormalizedContentType(file);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Step 2: Request presigned S3 upload URL from NestJS backend
    // POST /storage/upload-url (Authorization header attached automatically by apiClient)
    let presignedData: PresignedUploadUrlResponse;
    try {
      const response = await apiClient.post<PresignedUploadUrlResponse>(
        "/storage/upload-url",
        {
          fileName: sanitizedFileName,
          contentType,
          folder: "avatars",
        },
      );

      if (!response.data || !response.data.uploadUrl || !response.data.publicUrl) {
        throw new Error(response.error || "Storage service returned an incomplete upload descriptor.");
      }
      presignedData = response.data;
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 503) {
        throw new Error("Cloud storage is currently unavailable on the backend server. Please try again later.");
      }
      const message = err instanceof Error ? err.message : "Failed to obtain secure upload URL.";
      throw new Error(message);
    }

    // Step 3: Upload raw image binary to S3 presigned URL
    // CRITICAL: We use native window.fetch directly to ensure NO API Authorization Bearer token is sent to S3!
    try {
      const s3Response = await fetch(presignedData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: file,
      });

      if (!s3Response.ok) {
        throw new Error(`S3 upload rejected with status ${s3Response.status} ${s3Response.statusText}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload file to storage.";
      throw new Error(`Cloud storage upload failed: ${message}`);
    }

    // Step 4: Persist new avatar URL to user profile
    // PATCH /users/profile with { avatar_url: publicUrl }
    try {
      const updateRes = await customAuthService.updateProfile({
        avatar_url: presignedData.publicUrl,
      });

      if (!updateRes.data && updateRes.error) {
        throw new Error(updateRes.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile record.";
      throw new Error(`Avatar uploaded to storage but profile update failed: ${message}`);
    }

    // Step 5: Notify application listeners for immediate reactive UI update
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("makersflow:avatar_updated", {
          detail: { avatar_url: presignedData.publicUrl },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("makersflow:profile_updated", {
          detail: { avatar_url: presignedData.publicUrl },
        }),
      );
    }

    return {
      publicUrl: presignedData.publicUrl,
      key: presignedData.key,
    };
  },
};
