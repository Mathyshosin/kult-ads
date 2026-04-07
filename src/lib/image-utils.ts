// Compress a base64 image client-side to reduce upload size
export async function compressBase64(
  base64: string,
  mimeType: string,
  maxSize = 768
): Promise<{ base64: string; mimeType: string }> {
  if (!base64) return { base64, mimeType };

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        const ratio = Math.min(maxSize / w, maxSize / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ base64, mimeType });
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const compressed = dataUrl.split(",")[1];
      resolve({ base64: compressed, mimeType: "image/jpeg" });
    };
    img.onerror = () => resolve({ base64, mimeType });
    img.src = `data:${mimeType};base64,${base64}`;
  });
}
