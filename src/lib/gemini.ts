import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || "" });

export async function generateImage(
  prompt: string,
  aspectRatio: string = "1:1",
  referenceImageBase64?: string,
  referenceImageMimeType?: string
): Promise<{ imageBase64: string; mimeType: string } | null> {
  const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];

  if (referenceImageBase64) {
    contents.push({
      inlineData: {
        mimeType: referenceImageMimeType || "image/png",
        data: referenceImageBase64,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
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
