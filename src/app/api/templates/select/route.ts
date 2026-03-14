import { NextResponse } from "next/server";
import { getTemplates } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTemplateAnalysesBatch } from "@/lib/supabase/template-analysis";
import { selectBestTemplates } from "@/lib/template-tags";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { brandAnalysis, offer, format, count, adStyle } = await request.json();

    if (!brandAnalysis) {
      return NextResponse.json({ error: "Brand analysis manquante" }, { status: 400 });
    }

    // Get all templates
    const allTemplates = await getTemplates();
    const targetFormat = format || "square";

    // Filter by format first
    const formatTemplates = allTemplates.filter((t) => t.format === targetFormat);

    if (formatTemplates.length === 0) {
      return NextResponse.json({ templateIds: [], scores: {} });
    }

    // Fetch pre-computed analyses from Supabase
    const templateIds = formatTemplates.map((t) => t.id);
    const analyses = await getTemplateAnalysesBatch(templateIds);

    // Build brand info for scoring
    const brandInfo = {
      brandName: brandAnalysis.brandName,
      brandDescription: brandAnalysis.brandDescription,
      tone: brandAnalysis.tone,
      targetAudience: brandAnalysis.targetAudience,
      competitorProducts: brandAnalysis.competitorProducts,
      products: brandAnalysis.products?.map((p: { name: string; description?: string; features?: string[] }) => ({
        name: p.name,
        description: p.description,
        features: p.features,
      })),
    };

    // Build offer info for scoring
    const offerInfo = offer
      ? {
          title: offer.title,
          discountValue: offer.discountValue ? Number(offer.discountValue) : undefined,
          discountType: offer.discountType,
          originalPrice: offer.originalPrice,
          salePrice: offer.salePrice,
        }
      : null;

    // If adStyle filter is provided, boost templates that have that adType tag
    // We do this by pre-filtering: prefer templates with the tag, fallback to all
    let candidateTemplates = formatTemplates;
    if (adStyle) {
      const withTag = formatTemplates.filter(
        (t) => t.tags?.adType?.includes(adStyle)
      );
      if (withTag.length > 0) {
        candidateTemplates = withTag;
      }
      // If no templates have the tag, fall back to all templates
    }

    // Run scoring algorithm
    const { selected, scores } = selectBestTemplates(
      candidateTemplates,
      analyses,
      brandInfo,
      offerInfo,
      targetFormat,
      count || 6,
    );

    return NextResponse.json({
      templateIds: selected.map((t) => t.id),
      scores,
    });
  } catch (error) {
    console.error("[templates/select] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 },
    );
  }
}
