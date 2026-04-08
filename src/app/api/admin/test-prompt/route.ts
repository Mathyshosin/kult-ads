import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || "" });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { promptText, format } = await req.json();
  if (!promptText) {
    return NextResponse.json({ error: "promptText required" }, { status: 400 });
  }

  const aspectRatio = format === "story" ? "9:16" : "1:1";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: promptText,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: { aspectRatio },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return NextResponse.json({
          imageBase64: part.inlineData.data || "",
          mimeType: part.inlineData.mimeType || "image/png",
        });
      }
    }

    const finishReason = response.candidates?.[0]?.finishReason || "unknown";
    const textResponse = parts.filter((p: { text?: string }) => p.text).map((p: { text?: string }) => p.text).join(" ").slice(0, 300);
    return NextResponse.json({ error: `Pas d'image (${finishReason}): ${textResponse || "reponse vide"}` }, { status: 500 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[test-prompt]", msg);
    return NextResponse.json({ error: msg.slice(0, 300) }, { status: 500 });
  }
}
