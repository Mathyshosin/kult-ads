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

ABSOLUTE RULES — YOU MUST FOLLOW EVERY SINGLE ONE:
1. Keep the EXACT same product — identical shape, identical colors, identical appearance. Do NOT redraw or reinterpret the product.
2. Keep the EXACT same text — every single word, letter, number, percentage, brand name must be IDENTICAL. Do NOT change, translate, rephrase, or remove ANY text.
3. Keep the EXACT same colors — background colors, text colors, accent colors, gradient colors must be pixel-perfect identical.
4. Keep the EXACT same design elements — same logo, same decorative shapes, same layout structure.
5. EXTEND the background vertically (add more background above and below) to fill the 9:16 ratio. The extended background must seamlessly match the existing background colors, gradients, and textures.
6. Slightly increase the size of all elements (product, text, logo) by about 5-10% so they feel natural at the taller format.
7. Do NOT crop, cut, or remove any element from the original ad.
8. Do NOT add any new text, elements, graphics, or objects that were NOT in the original.
9. Do NOT change fonts, font sizes ratios, font weights, or text styling.
10. The result must look like the EXACT same ad, just reformatted for vertical display.`;

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
