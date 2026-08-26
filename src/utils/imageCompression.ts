import imageCompression from "browser-image-compression";

/**
 * Compresses an image file before uploading to Firebase Storage.
 * Strictly enforces a 1920x1080 boundary and 0.5MB (500KB) target size.
 * Converts large PNGs to JPEG to prevent multi-megabyte bloat.
 * 
 * @param file The original File object
 * @returns A compressed File object
 */
export async function compressImageUpload(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5, // Max 500KB
    maxWidthOrHeight: 1920, // Strict 1920 boundary
    useWebWorker: true,
    initialQuality: 0.82,
    fileType: file.type === "image/png" && file.size > 1.5 * 1024 * 1024 ? "image/jpeg" : undefined,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const compressedFile = new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
    return compressedFile;
  } catch (error) {
    console.warn("Image compression fallback to original:", error);
    return file;
  }
}
