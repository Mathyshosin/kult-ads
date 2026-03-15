import { NextResponse } from "next/server";
import { analyzeWithClaude } from "@/lib/claude";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { scrapedData } = await request.json();

    if (!scrapedData) {
      return NextResponse.json(
        { error: "Données scrapées requises" },
        { status: 400 }
      );
    }

    const rawResponse = await analyzeWithClaude(scrapedData);

    // Try to parse JSON from Claude's response
    let analysis;
    try {
      analysis = JSON.parse(rawResponse);
    } catch {
      // Try to extract JSON from response if wrapped in text
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Claude n'a pas retourné du JSON valide");
      }
    }

    return NextResponse.json(analysis);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de l'analyse";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
