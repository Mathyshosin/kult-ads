import { NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 });
    }

    // Use Gemini to extend the square ad into story format (9:16)
    // The prompt tells Gemini to extend the background vertically and slightly scale up elements
    const prompt = `Convert this square (1:1) advertisement to a vertical story format (9:16 / 1080x1920).

CRITICAL RULES:
1. Keep the EXACT same ad content — same product, same text, same brand, same colors, same design.
2. EXTEND the background vertically (add more background above and below) to fill the 9:16 ratio.
3. Slightly increase the size of all elements (product, text, logo) by about 5-10% so they feel natural at 1080x1920.
4. The background extension must be seamless — match the existing background colors, gradients, and textures perfectly.
5. Do NOT crop, cut, or remove any element from the original ad.
6. Do NOT add any new text, elements, or graphics that weren't in the original.
7. Do NOT modify the text content — keep every word exactly as it is.
8. The result should look like the ad was originally designed for story format.`;

    const result = await generateImage(
      prompt,
      "9:16",
      [{
        base64: imageBase64,
        mimeType: mimeType || "image/png",
        label: "ORIGINAL SQUARE AD — extend this to 9:16 story format",
      }],
    );

    if (!result) {
      return NextResponse.json(
        { error: "Échec de la conversion en story" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
    });
  } catch (error) {
    console.error("[convert-story] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 },
    );
  }
}
