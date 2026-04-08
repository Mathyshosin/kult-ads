import { NextResponse } from "next/server";
import { analyzeTemplateMetadata } from "@/lib/claude";
import { getTemplateByIdWithImage, getTemplates } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import {
  saveTemplateAnalysisToDb,
  getAnalyzedTemplateIds,
} from "@/lib/supabase/template-analysis";

// Vercel Hobby = 60s max. With parallelization (3 concurrent), 15 templates ≈ 5 rounds × 10s = 50s.
export const maxDuration = 60;

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
      const template = await getTemplateByIdWithImage(targetId);
      if (!template) {
        return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
      }

      console.log(`[analyze] Analyzing template ${targetId}...`);
      const analysis = await analyzeTemplateMetadata(template.imageBase64, template.mimeType);
      await saveTemplateAnalysisToDb(targetId, analysis);
      console.log(`[analyze] ✅ Template ${targetId} analyzed and saved to Supabase`);

      return NextResponse.json({ analyzed: 1, results: [{ id: targetId, analysis }] });
    }

    // Get all templates
    const allTemplates = await getTemplates();

    // Determine which need analysis
    let templatesToAnalyze;
    if (forceReanalyze) {
      templatesToAnalyze = allTemplates;
    } else {
      const alreadyAnalyzed = await getAnalyzedTemplateIds();
      templatesToAnalyze = allTemplates.filter((t) => !alreadyAnalyzed.includes(t.id));
    }

    if (templatesToAnalyze.length === 0) {
      return NextResponse.json({ analyzed: 0, message: "Tous les templates sont déjà analysés" });
    }

    console.log(`[analyze] ${templatesToAnalyze.length} templates to analyze (3 concurrent)...`);
    const results: Array<{ id: string; name: string; analysis: unknown }> = [];

    // Process in batches of 3 concurrent Claude calls (avoids timeout + rate limits)
    const CONCURRENCY = 3;
    for (let i = 0; i < templatesToAnalyze.length; i += CONCURRENCY) {
      const batch = templatesToAnalyze.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map(async (t) => {
          const template = await getTemplateByIdWithImage(t.id);
          if (!template) throw new Error(`Template image not found: ${t.id}`);

          console.log(`[analyze] Analyzing ${t.id} (${t.name})...`);
          const analysis = await analyzeTemplateMetadata(template.imageBase64, template.mimeType);
          await saveTemplateAnalysisToDb(t.id, analysis);
          console.log(`[analyze] ✅ ${t.id} saved`);
          return { id: t.id, name: t.name, analysis };
        })
      );

      for (let j = 0; j < batchResults.length; j++) {
        const r = batchResults[j];
        if (r.status === "fulfilled") {
          results.push(r.value);
        } else {
          const t = batch[j];
          console.error(`[analyze] ❌ Failed for ${t.id}:`, r.reason);
          results.push({ id: t.id, name: t.name, analysis: { error: String(r.reason) } });
        }
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
