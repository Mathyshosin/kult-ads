// Client-side Gemini image generation — calls Google REST API directly from the browser.
// No Vercel timeout limit. The browser waits as long as needed.

const GEMINI_MODEL = "gemini-2.5-flash-image";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface ReferenceImage {
  base64: string;
  mimeType: string;
  label: string;
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

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { aspectRatio },
    },
  };

  let lastError = "";

  // 2 attempts with exponential backoff
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[gemini-client] Attempt ${attempt}/2 (${referenceImages.length} images, ${prompt.length} chars)`);

      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
        const msg = err?.error?.message || `HTTP ${res.status}`;
        lastError = msg;

        // Rate limit — wait and retry
        if (res.status === 429 || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("rate")) {
          const waitMs = attempt * 4000;
          console.warn(`[gemini-client] Rate limited — waiting ${waitMs / 1000}s`);
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }
        }

        // High demand — wait and retry
        if (msg.includes("high demand") || msg.includes("overloaded")) {
          const waitMs = attempt * 5000;
          console.warn(`[gemini-client] High demand — waiting ${waitMs / 1000}s`);
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }
        }

        console.error(`[gemini-client] Attempt ${attempt} error:`, msg);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        break;
      }

      const data = await res.json();
      const candidates = data.candidates?.[0]?.content?.parts || [];

      for (const part of candidates) {
        if (part.inlineData) {
          console.log(`[gemini-client] Success on attempt ${attempt}`);
          return {
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png",
          };
        }
      }

      // No image in response
      const textParts = candidates.filter((p: { text?: string }) => p.text).map((p: { text?: string }) => p.text).join(" ").slice(0, 200);
      lastError = textParts || "No image generated";
      console.warn(`[gemini-client] Attempt ${attempt}: ${lastError}`);

    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[gemini-client] Attempt ${attempt} error:`, lastError);
    }

    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.error(`[gemini-client] All attempts failed: ${lastError}`);
  return null;
}
