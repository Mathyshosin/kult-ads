import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || "" });

interface ReferenceImage {
  base64: string;
  mimeType: string;
  label: string;
}

/**
 * Compress a base64 image server-side using sharp.
 * Always compresses — the cold start cost (~2s) is worth the faster Gemini response.
 */
async function compressForGemini(base64: string, maxSize: number = 768): Promise<{ base64: string; mimeType: string }> {
  try {
    const { default: sharp } = await import("sharp");
    const buffer = Buffer.from(base64, "base64");
    const compressed = await sharp(buffer)
      .resize(maxSize, maxSize, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();
    return { base64: compressed.toString("base64"), mimeType: "image/jpeg" };
  } catch {
    return { base64, mimeType: "image/jpeg" };
  }
}

export async function generateImage(
  prompt: string,
  aspectRatio: string = "1:1",
  referenceImages: ReferenceImage[] = [],
  maxRetries: number = 2,
): Promise<{ imageBase64: string; mimeType: string } | null> {
  // Always compress images — smaller payload = faster Gemini response
  // Template/reference images: 512px (just need layout understanding)
  // Product images: 768px (need more detail)
  const compressedRefs = await Promise.all(
    referenceImages.map(async (img, i) => {
      const isProductPhoto = img.label.toLowerCase().includes("product photo");
      const maxSize = isProductPhoto ? 768 : 512;
      const compressed = await compressForGemini(img.base64, maxSize);
      return { ...img, base64: compressed.base64, mimeType: compressed.mimeType };
    })
  );

  const contents: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [];

  // Reference images FIRST, then prompt text
  for (const img of compressedRefs) {
    contents.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    });
    contents.push({ text: img.label });
  }

  // Main prompt LAST
  contents.push({ text: prompt });

  let lastError = "";
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[gemini] Attempt ${attempt}/${maxRetries} (${referenceImages.length} images, prompt ${prompt.length} chars)`);

      const genPromise = ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents,
        config: {
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: { aspectRatio },
        },
      });

      // 50s timeout — leaves 10s headroom within Vercel's 60s limit
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout (50s)")), 50000)
      );
      const response = await Promise.race([genPromise, timeoutPromise]);

      const parts = response.candidates?.[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.inlineData) {
          console.log(`[gemini] Success on attempt ${attempt}`);
          return {
            imageBase64: part.inlineData.data || "",
            mimeType: part.inlineData.mimeType || "image/png",
          };
        }
      }

      // No image in response
      const finishReason = response.candidates?.[0]?.finishReason || "unknown";
      const textParts = parts.filter((p: { text?: string }) => p.text).map((p: { text?: string }) => p.text).join(" ").slice(0, 200);
      lastError = `No image (${finishReason}${textParts ? `: ${textParts}` : ""})`;
      console.warn(`[gemini] Attempt ${attempt}: ${lastError}`);

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      lastError = errMsg;
      console.error(`[gemini] Attempt ${attempt} error:`, errMsg);

      // Rate limited — wait with exponential backoff
      if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("rate")) {
        const waitTime = 4000 * attempt; // 4s, 8s
        console.warn(`[gemini] Rate limited — waiting ${waitTime / 1000}s`);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, waitTime));
        }
        continue;
      }
    }

    // Wait before retry (non-rate-limit failures)
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.error(`[gemini] All ${maxRetries} attempts failed: ${lastError}`);
  (generateImage as { lastError?: string }).lastError = lastError;
  return null;
}
