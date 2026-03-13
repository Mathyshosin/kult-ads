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
  referenceImages: ReferenceImage[] = []
): Promise<{ imageBase64: string; mimeType: string } | null> {
  const contents: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: prompt }];

  // Add all reference images
  for (const img of referenceImages) {
    contents.push({ text: `[${img.label}]` });
    contents.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents,
    config: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  // Extract image from response
  const parts = response.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData) {
      return {
        imageBase64: part.inlineData.data || "",
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }

  return null;
}
