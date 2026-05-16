/**
 * Performance-optimized dynamic color extraction engine.
 * Uses Canvas API to extract the dominant tone from 4K images.
 */

export async function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve("#ffffff");

        // Use a small sample size for performance
        canvas.width = 50;
        canvas.height = 50;

        ctx.drawImage(img, 0, 0, 50, 50);
        const imageData = ctx.getImageData(0, 0, 50, 50).data;

        let r = 0, g = 0, b = 0;
        const totalPixels = imageData.length / 4;

        for (let i = 0; i < imageData.length; i += 4) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
        }

        r = Math.floor(r / totalPixels);
        g = Math.floor(g / totalPixels);
        b = Math.floor(b / totalPixels);

        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch (e) {
        console.error("Color extraction failed", e);
        resolve("#ffffff");
      }
    };

    img.onerror = () => {
      resolve("#ffffff");
    };
  });
}
