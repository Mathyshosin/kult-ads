// Client-side Gemini image generation — calls Google REST API directly from the browser.
// No Vercel timeout limit. The browser waits as long as needed.
// Uses primary model with fallback to secondary on failure.

const MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
];
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface ReferenceImage {
  base64: string;
  mimeType: string;
  label: string;
}

async function callGemini(
  apiKey: string,
  model: string,
  parts: Array<Record<string, unknown>>,
  aspectRatio: string,
): Promise<{ imageBase64: string; mimeType: string } | { error: string }> {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: { aspectRatio },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
    return { error: err?.error?.message || `HTTP ${res.status}` };
  }

  const data = await res.json();
  const candidates = data.candidates?.[0]?.content?.parts || [];

  for (const part of candidates) {
    if (part.inlineData) {
      return {
        imageBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }

  const textResponse = candidates
    .filter((p: { text?: string }) => p.text)
    .map((p: { text?: string }) => p.text)
    .join(" ")
    .slice(0, 300);

  return { error: textResponse || "No image in response" };
}

export async function generateImageClient(
  apiKey: string,
  prompt: string,
  aspectRatio: string,
  referenceImages: ReferenceImage[] = [],
): Promise<{ imageBase64: string; mimeType: string } | null> {
  // Build parts array: images first (with labels), then prompt text
  const parts: Array<Record<string, unknown>> = [];
  for (const img of referenceImages) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
    parts.push({ text: img.label });
  }
  parts.push({ text: prompt });

  // Try each model — primary first, then fallback
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      console.log(`[gemini-client] ${model} attempt ${attempt}/2 (${referenceImages.length} images, ${prompt.length} chars)`);

      try {
        const result = await callGemini(apiKey, model, parts, aspectRatio);

        if ("imageBase64" in result) {
          console.log(`[gemini-client] Success with ${model} on attempt ${attempt}`);
          return result;
        }

        // Error handling
        const errMsg = result.error;
        console.warn(`[gemini-client] ${model} attempt ${attempt}: ${errMsg}`);

        // Rate limit or high demand — wait and retry same model
        if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("rate") || errMsg.includes("high demand") || errMsg.includes("overloaded")) {
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, attempt * 4000));
            continue;
          }
        }

        // No image generated — try next attempt or next model
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

      } catch (err) {
        console.error(`[gemini-client] ${model} attempt ${attempt} exception:`, err instanceof Error ? err.message : err);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    // This model failed after 2 attempts — try next model
    console.warn(`[gemini-client] ${model} failed, trying next model...`);
  }

  console.error(`[gemini-client] All models failed`);
  return null;
}
