import { NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 120;

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

    // Credit check (admin bypasses)
    if (user.email !== "mathys.hosin@gmail.com") {
      const { getOrCreateSubscription } = await import("@/lib/supabase/subscriptions");
      const subscription = await getOrCreateSubscription(user.id, user.email || undefined);
      if (subscription.credits_remaining <= 0) {
        return NextResponse.json(
          { error: "Plus de crédits disponibles.", code: "NO_CREDITS" },
          { status: 402 }
        );
      }
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
      return NextResponse.json(
        { error: "Aucune image générée. Essayez un autre prompt." },
        { status: 500 }
      );
    }

    // Deduct credit after success (admin bypasses)
    if (user.email !== "mathys.hosin@gmail.com") {
      const { deductCredit } = await import("@/lib/supabase/subscriptions");
      await deductCredit(user.id);
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
