import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateImage } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { imageBase64, mimeType } = await request.json();
    if (!imageBase64) return NextResponse.json({ error: "Image manquante" }, { status: 400 });

    const result = await generateImage(
      "Extract ONLY the product from this photo. Remove the background, remove any person/model, remove any props. Keep ONLY the product item itself (the garment, the packaging, the bottle, etc.) on a pure white background. The product must be centered, fully visible, with clean edges. Output a clean product-only image on white background.",
      "1:1",
      [{
        base64: imageBase64,
        mimeType: mimeType || "image/jpeg",
        label: "Source photo — extract only the product from this image, remove everything else.",
      }],
      1
    );

    if (!result) {
      return NextResponse.json({ error: "Échec du détourage" }, { status: 500 });
    }

    return NextResponse.json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
    });
  } catch (err) {
    console.error("[remove-bg] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
