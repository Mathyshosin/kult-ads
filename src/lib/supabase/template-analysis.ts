import { createClient } from "./client";
import type { TemplateAnalysisData } from "@/lib/template-store";

const supabase = () => createClient();

// ── Save or update analysis for a template ──
export async function saveTemplateAnalysisToDb(
  templateId: string,
  analysis: TemplateAnalysisData
): Promise<boolean> {
  const { error } = await supabase()
    .from("template_analyses")
    .upsert(
      {
        template_id: templateId,
        analysis,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "template_id" }
    );

  if (error) {
    console.error("[template-analysis] Save error:", error);
    return false;
  }
  return true;
}

// ── Get analysis for a single template ──
export async function getTemplateAnalysisFromDb(
  templateId: string
): Promise<TemplateAnalysisData | null> {
  const { data, error } = await supabase()
    .from("template_analyses")
    .select("analysis")
    .eq("template_id", templateId)
    .single();

  if (error || !data) return null;
  return data.analysis as TemplateAnalysisData;
}

// ── Get analyses for multiple templates at once ──
export async function getTemplateAnalysesBatch(
  templateIds: string[]
): Promise<Record<string, TemplateAnalysisData>> {
  if (templateIds.length === 0) return {};

  const { data, error } = await supabase()
    .from("template_analyses")
    .select("template_id, analysis")
    .in("template_id", templateIds);

  if (error || !data) return {};

  const result: Record<string, TemplateAnalysisData> = {};
  for (const row of data) {
    result[row.template_id] = row.analysis as TemplateAnalysisData;
  }
  return result;
}

// ── Get all analyzed template IDs ──
export async function getAnalyzedTemplateIds(): Promise<string[]> {
  const { data, error } = await supabase()
    .from("template_analyses")
    .select("template_id");

  if (error || !data) return [];
  return data.map((row) => row.template_id);
}
