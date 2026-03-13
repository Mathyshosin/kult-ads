import { NextResponse } from "next/server";
import { generateAdConcepts } from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const { brandAnalysis, product, offer, count } = await request.json();

    if (!brandAnalysis || !product) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const raw = await generateAdConcepts(
      brandAnalysis.brandName,
      brandAnalysis.brandDescription,
      brandAnalysis.tone,
      product.name,
      product.description,
      brandAnalysis.targetAudience || "",
      brandAnalysis.colors || [],
      brandAnalysis.uniqueSellingPoints || [],
      offer?.title,
      offer?.description,
      count || 4
    );

    // Parse the JSON from Claude
    let concepts;
    try {
      concepts = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        concepts = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse ad concepts");
      }
    }

    return NextResponse.json(concepts);
  } catch (error) {
    console.error("[ad-concepts] ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération des concepts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
