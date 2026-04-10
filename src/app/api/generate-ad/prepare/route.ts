import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTemplateByIdWithImage, getRandomTemplateWithImage } from "@/lib/template-store";
import { getTemplateAnalysisFromDb } from "@/lib/supabase/template-analysis";

export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, format = "square", skipCreditCheck } = body;

    // ── Credit deduction ──
    let creditCost = 0;
    if (!skipCreditCheck) {
      const { deductCredit } = await import("@/lib/supabase/subscriptions");
      const result = await deductCredit(user.id);
      if (!result.success) {
        return NextResponse.json(
          { error: "Plus de credits disponibles.", code: "NO_CREDITS" },
          { status: 402 }
        );
      }
      creditCost = result.cost;
    }

    // ── Load template (if needed) ──
    let templateData: {
      id: string;
      imageBase64: string;
      mimeType: string;
      generationPrompt: string | null;
    } | null = null;

    if (templateId) {
      templateData = await getTemplateByIdWithImage(templateId);
    } else {
      // Auto mode: pick a random template
      templateData = await getRandomTemplateWithImage(format as "square" | "story", user.id);
    }

    // ── Load template analysis (if template found) ──
    let templateAnalysis = null;
    if (templateData) {
      try {
        const analysis = await getTemplateAnalysisFromDb(templateData.id);
        templateAnalysis = analysis;
      } catch { /* no cached analysis, use defaults */ }
    }

    // ── API key ──
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || "";

    return NextResponse.json({
      apiKey,
      creditCost,
      templateId: templateData?.id || null,
      templateImageBase64: templateData?.imageBase64 || null,
      templateMimeType: templateData?.mimeType || null,
      generationPrompt: templateData?.generationPrompt || null,
      templateAnalysis,
    });
  } catch (error) {
    console.error("[prepare] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur preparation" },
      { status: 500 }
    );
  }
}
