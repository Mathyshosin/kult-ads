import { NextResponse } from "next/server";
import { analyzeTemplateMetadata } from "@/lib/claude";
import {
  getTemplatesNeedingAnalysis,
  getTemplateByIdWithImage,
  saveTemplateAnalysis,
} from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const forceReanalyze = body.forceReanalyze === true;
    const targetId = body.templateId as string | undefined;

    // If a specific template ID is provided, analyze only that one
    if (targetId) {
      const template = getTemplateByIdWithImage(targetId);
      if (!template) {
        return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
      }

      console.log(`[analyze] Analyzing template ${targetId}...`);
      const analysis = await analyzeTemplateMetadata(template.imageBase64, template.mimeType);
      saveTemplateAnalysis(targetId, analysis);
      console.log(`[analyze] ✅ Template ${targetId} analyzed:`, JSON.stringify(analysis, null, 2));

      return NextResponse.json({ analyzed: 1, results: [{ id: targetId, analysis }] });
    }

    // Otherwise, analyze all templates that need it
    const templates = forceReanalyze
      ? (await import("@/lib/template-store")).getTemplates()
      : getTemplatesNeedingAnalysis();

    if (templates.length === 0) {
      return NextResponse.json({ analyzed: 0, message: "Tous les templates sont déjà analysés" });
    }

    console.log(`[analyze] ${templates.length} templates to analyze...`);
    const results: Array<{ id: string; name: string; analysis: unknown }> = [];

    for (const t of templates) {
      try {
        const template = getTemplateByIdWithImage(t.id);
        if (!template) continue;

        console.log(`[analyze] Analyzing ${t.id} (${t.name})...`);
        const analysis = await analyzeTemplateMetadata(template.imageBase64, template.mimeType);
        saveTemplateAnalysis(t.id, analysis);
        results.push({ id: t.id, name: t.name, analysis });
        console.log(`[analyze] ✅ ${t.id} done`);
      } catch (err) {
        console.error(`[analyze] ❌ Failed for ${t.id}:`, err);
        results.push({ id: t.id, name: t.name, analysis: { error: String(err) } });
      }
    }

    return NextResponse.json({ analyzed: results.length, results });
  } catch (error) {
    console.error("[analyze] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
