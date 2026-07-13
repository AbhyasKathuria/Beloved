/**
 * Loads an image, renders it to an offscreen canvas, and dynamically removes the
 * white/near-white background by adjusting the alpha channel.
 * Returns a base64 Data URL.
 */
export function makeImageTransparent(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Threshold: pixels with R, G, B all above 240 are faded to transparent
      const threshold = 240;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r > threshold && g > threshold && b > threshold) {
          const avg = (r + g + b) / 3;
          // Scale alpha linearly from 255 (at threshold) to 0 (at 255)
          const alphaFactor = (255 - avg) / (255 - threshold);
          data[i + 3] = Math.max(0, Math.min(255, Math.floor(alphaFactor * 255)));
        }
      }
      
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      resolve(src);
    };
  });
}
