import { NextResponse } from "next/server";
import { getTemplates } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { format, count, productType } = await request.json();

    // Get all templates
    const allTemplates = await getTemplates();
    const targetFormat = format || "square";

    // Filter by format
    let candidates = allTemplates.filter((t) => t.format === targetFormat);

    if (candidates.length === 0) {
      return NextResponse.json({ templateIds: [] });
    }

    // Filter by product type (produit / service) if specified
    if (productType) {
      const withType = candidates.filter(
        (t) => t.tags?.productType?.[0] === productType
      );
      // If matching templates exist, use them; otherwise fall back to all
      if (withType.length > 0) {
        candidates = withType;
      }
    }

    // Random selection
    const needed = Math.min(count || 1, candidates.length);
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, needed);

    return NextResponse.json({
      templateIds: selected.map((t) => t.id),
    });
  } catch (error) {
    console.error("[templates/select] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 },
    );
  }
}
