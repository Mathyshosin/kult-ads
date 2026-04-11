import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTemplateByIdWithImage, getRandomTemplateWithImage } from "@/lib/template-store";
import { getTemplateAnalysisFromDb } from "@/lib/supabase/template-analysis";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, format = "square", skipCreditCheck, beastCount } = body;
    const count = Math.min(Math.max(1, Number(beastCount) || 1), 10);

    // ── Credit deduction ──
    let creditCost = 0;
    if (!skipCreditCheck) {
      const { deductCredit, addCredits } = await import("@/lib/supabase/subscriptions");

      // Beast mode: deduct all credits at once (10 × count)
      if (count > 1) {
        // Check balance first
        const checkRes = await supabase
          .from("user_subscriptions")
          .select("credits_remaining")
          .eq("user_id", user.id)
          .single();

        const needed = 10 * count;
        if (!checkRes.data || checkRes.data.credits_remaining < needed) {
          return NextResponse.json(
            { error: `Pas assez de credits. ${needed} requis.`, code: "NO_CREDITS" },
            { status: 402 }
          );
        }

        // Deduct all at once
        const newCredits = checkRes.data.credits_remaining - needed;
        await supabase
          .from("user_subscriptions")
          .update({ credits_remaining: newCredits })
          .eq("user_id", user.id);
        creditCost = needed;
      } else {
        // Single generation
        const result = await deductCredit(user.id);
        if (!result.success) {
          return NextResponse.json(
            { error: "Plus de credits disponibles.", code: "NO_CREDITS" },
            { status: 402 }
          );
        }
        creditCost = result.cost;
      }
    }

    // ── Load templates ──
    const templates: Array<{
      id: string;
      imageBase64: string;
      mimeType: string;
      generationPrompt: string | null;
      templateAnalysis: unknown;
    }> = [];

    if (count > 1) {
      // Beast mode: load multiple random templates
      const usedIds = new Set<string>();
      for (let i = 0; i < count; i++) {
        const tpl = await getRandomTemplateWithImage(format as "square" | "story", user.id);
        if (tpl && !usedIds.has(tpl.id)) {
          usedIds.add(tpl.id);
          let analysis = null;
          try { analysis = await getTemplateAnalysisFromDb(tpl.id); } catch {}
          templates.push({
            id: tpl.id,
            imageBase64: tpl.imageBase64,
            mimeType: tpl.mimeType,
            generationPrompt: tpl.generationPrompt,
            templateAnalysis: analysis,
          });
        } else if (tpl) {
          // Duplicate — still use it but with the same data
          let analysis = null;
          try { analysis = await getTemplateAnalysisFromDb(tpl.id); } catch {}
          templates.push({
            id: tpl.id,
            imageBase64: tpl.imageBase64,
            mimeType: tpl.mimeType,
            generationPrompt: tpl.generationPrompt,
            templateAnalysis: analysis,
          });
        }
      }
    } else {
      // Single mode
      let templateData = templateId
        ? await getTemplateByIdWithImage(templateId)
        : await getRandomTemplateWithImage(format as "square" | "story", user.id);

      if (templateData) {
        let analysis = null;
        try { analysis = await getTemplateAnalysisFromDb(templateData.id); } catch {}
        templates.push({
          id: templateData.id,
          imageBase64: templateData.imageBase64,
          mimeType: templateData.mimeType,
          generationPrompt: templateData.generationPrompt,
          templateAnalysis: analysis,
        });
      }
    }

    // ── API key ──
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || "";

    // Return compatible format for both single and beast mode
    const firstTemplate = templates[0] || null;

    return NextResponse.json({
      apiKey,
      creditCost,
      // Single mode compatibility
      templateId: firstTemplate?.id || null,
      templateImageBase64: firstTemplate?.imageBase64 || null,
      templateMimeType: firstTemplate?.mimeType || null,
      generationPrompt: firstTemplate?.generationPrompt || null,
      templateAnalysis: firstTemplate?.templateAnalysis || null,
      // Beast mode
      templates: count > 1 ? templates : undefined,
    });
  } catch (error) {
    console.error("[prepare] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur preparation" },
      { status: 500 }
    );
  }
}
