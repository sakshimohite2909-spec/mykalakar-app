import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { FIREBASE_UPLOAD_TIMEOUT_MS } from "@/lib/firebaseSafe";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// ─── Compress + Resize image before upload ───────────────────────────────────
export function compressImage(file: File, maxWidthPx = 1200, quality = 0.82): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width);
        width = maxWidthPx;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Image compression failed"));
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image for compression"));
    };
    img.src = objectUrl;
  });
}

// ─── Validate file before upload ─────────────────────────────────────────────
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file || !(file instanceof File)) return { valid: false, error: "No valid file provided." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type))
    return { valid: false, error: `Invalid file type (${file.type}). Only JPG, PNG, WebP, GIF allowed.` };
  if (file.size > MAX_FILE_SIZE_BYTES)
    return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB allowed.` };
  return { valid: true };
}

// ─── Upload with progress callback ───────────────────────────────────────────
export function uploadFileWithProgress(
  file: File,
  storagePath: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `${storagePath}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });
    const timeoutId = setTimeout(() => {
      uploadTask.cancel();
      reject(new Error("The upload is taking too long. Please try a smaller image or check your connection."));
    }, FIREBASE_UPLOAD_TIMEOUT_MS);

    const finish = (callback: () => void) => {
      clearTimeout(timeoutId);
      callback();
    };

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(percent);
      },
      (error) => {
        console.error("Storage upload error:", {
          code: error.code,
          message: error.message,
          serverResponse: error.serverResponse,
        });
        finish(() => reject(error));
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          finish(() => resolve(url));
        } catch (err) {
          finish(() => reject(err));
        }
      }
    );
  });
}

// ─── Main upload helper: validate → compress → upload ────────────────────────
export async function uploadImageFile(
  file: File | null | undefined,
  storagePath: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const DEFAULT_AVATAR =
    "https://ui-avatars.com/api/?name=Artist&background=f97316&color=fff&size=256";

  if (!file) return DEFAULT_AVATAR;

  const validation = validateImageFile(file);
  if (!validation.valid) {
    console.warn(`File validation failed for ${storagePath}: ${validation.error}`);
    throw new Error(validation.error);
  }

  // Compress images that are >200KB or wider than 1200px
  let fileToUpload = file;
  if (file.size > 200 * 1024 && ALLOWED_IMAGE_TYPES.includes(file.type)) {
    try {
      fileToUpload = await compressImage(file);
    } catch (compressErr) {
      console.warn("Image compression failed, uploading original:", compressErr);
      fileToUpload = file;
    }
  }

  return uploadFileWithProgress(fileToUpload, storagePath, onProgress);
}
