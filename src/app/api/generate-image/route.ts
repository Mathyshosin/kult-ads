import { NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

// Vercel Hobby hard limit = 60s. Gemini timeout set to 50s in gemini.ts (10s headroom).
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { prompt, referenceImageBase64, referenceImageMimeType, aspectRatio } =
      await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt requis" },
        { status: 400 }
      );
    }

    // Deduct credit before generation (prevents race conditions; refund on failure)
    let creditCost = 0;
    if (!isAdmin(user.email)) {
      const { deductCredit } = await import("@/lib/supabase/subscriptions");
      const result = await deductCredit(user.id);
      if (!result.success) {
        return NextResponse.json(
          { error: "Plus de crédits disponibles.", code: "NO_CREDITS" },
          { status: 402 }
        );
      }
      creditCost = result.cost;
    }

    const refImages = referenceImageBase64
      ? [{ base64: referenceImageBase64, mimeType: referenceImageMimeType || "image/png", label: "REFERENCE" }]
      : [];

    const result = await generateImage(
      prompt,
      aspectRatio || "1:1",
      refImages
    );

    if (!result) {
      // Refund the credit since generation failed
      if (creditCost > 0) {
        const { addCredits } = await import("@/lib/supabase/subscriptions");
        await addCredits(user.id, creditCost);
      }
      return NextResponse.json(
        { error: "Aucune image générée. Essayez un autre prompt." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
