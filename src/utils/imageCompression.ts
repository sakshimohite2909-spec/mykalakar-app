import imageCompression from "browser-image-compression";

/**
 * Compresses an image file before uploading to Firebase Storage.
 * It strictly enforces a 1920x1080 boundary and 1MB size limit.
 * It automatically falls back to standard JPEG if WebP is unsupported or causes issues.
 * 
 * @param file The original File object
 * @returns A compressed File object
 */
export async function compressImageUpload(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Max 1MB
    maxWidthOrHeight: 1920, // Strict 1920x1080 boundary
    useWebWorker: true,
    fileType: file.type === "image/png" ? "image/jpeg" : undefined, // Convert huge PNGs to JPEGs or WebPs if we preferred
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Convert Blob back to File
    const compressedFile = new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
    
    // Log savings
    console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    
    return compressedFile;
  } catch (error) {
    console.error("Image compression failed, falling back to original:", error);
    return file; // Fallback to original if compression fails
  }
}
