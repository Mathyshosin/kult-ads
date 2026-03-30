import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || "" });

interface ReferenceImage {
  base64: string;
  mimeType: string;
  label: string; // e.g. "TEMPLATE" or "PRODUCT PHOTO"
}

export async function generateImage(
  prompt: string,
  aspectRatio: string = "1:1",
  referenceImages: ReferenceImage[] = [],
  maxRetries: number = 2
): Promise<{ imageBase64: string; mimeType: string } | null> {
  const contents: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [];

  // Reference images FIRST, then prompt text — Gemini processes images better when they come before the text instructions
  for (const img of referenceImages) {
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

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[gemini] Attempt ${attempt}/${maxRetries}...`);

      // 50s timeout to stay within Vercel's 60s limit
      const genPromise = ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents,
        config: {
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: {
            aspectRatio,
          },
        },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout (50s)")), 50000)
      );
      const response = await Promise.race([genPromise, timeoutPromise]);

      // Extract image from response
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

      // No image in response — log and retry
      console.warn(
        `[gemini] Attempt ${attempt}: No image in response. finishReason:`,
        response.candidates?.[0]?.finishReason || "unknown"
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[gemini] Attempt ${attempt} error:`, errMsg);

      // If rate-limited (429), wait longer
      if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("rate")) {
        console.warn(`[gemini] Rate limited — waiting ${5 * attempt}s before retry`);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 5000 * attempt));
        }
        continue;
      }
    }

    // Wait a bit before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  console.error(`[gemini] All ${maxRetries} attempts failed`);
  return null;
}
