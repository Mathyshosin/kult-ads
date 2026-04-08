import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { generateImage } from "@/lib/gemini";

export const maxDuration = 60;

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
    console.log(`[test-prompt] Sending prompt to Gemini (${promptText.length} chars, format=${format})`);
    const result = await generateImage(promptText, aspectRatio, [], 1);
    if (!result) {
      const detail = (generateImage as { lastError?: string }).lastError || "";
      return NextResponse.json({ error: `Gemini echec: ${detail || "aucune image generee"}` }, { status: 500 });
    }
    return NextResponse.json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[test-prompt] Error:", msg);
    return NextResponse.json({ error: `Erreur Gemini: ${msg}` }, { status: 500 });
  }
}
