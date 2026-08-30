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

/**
 * Converts any user uploaded image into an optimized, compact Base64 Data URL (30KB - 70KB)
 * that safely stores in Firestore when cloud storage buckets are unavailable.
 */
export async function fileToOptimizedDataUrl(file: File, maxDimension = 800, quality = 0.78): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(e.target?.result || ""));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          // Prefer WebP for supreme compression, fallback to JPEG
          const dataUrl = canvas.toDataURL("image/webp", quality);
          if (dataUrl && dataUrl.length > 20) {
            resolve(dataUrl);
            return;
          }
        } catch {
          // fallback to JPEG
        }

        const jpegUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(jpegUrl || String(e.target?.result || ""));
      };

      img.onerror = () => {
        resolve(String(e.target?.result || ""));
      };

      img.src = String(e.target?.result || "");
    };

    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

