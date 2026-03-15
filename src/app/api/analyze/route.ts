import { NextResponse } from "next/server";
import { analyzeWithClaude } from "@/lib/claude";
import { downloadImageAsBase64 } from "@/lib/scraper";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 60;

interface ProductImageMatch {
  productId: string;
  imageUrl: string;
  confidence: "high" | "medium" | "low";
}

interface DownloadedProductImage {
  productId: string;
  base64: string;
  mimeType: string;
  imageUrl: string;
}

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

    // ── Download matched product images in parallel ──
    const imageMatches: ProductImageMatch[] = analysis.productImageMatches || [];
    const downloadedImages: DownloadedProductImage[] = [];

    if (imageMatches.length > 0) {
      console.log(`[analyze] Downloading ${imageMatches.length} matched product images...`);

      const downloadPromises = imageMatches
        .filter((m) => m.confidence !== "low") // Skip low confidence
        .map(async (match) => {
          const result = await downloadImageAsBase64(match.imageUrl);
          if (result) {
            return {
              productId: match.productId,
              base64: result.base64,
              mimeType: result.mimeType,
              imageUrl: match.imageUrl,
            };
          }
          return null;
        });

      const results = await Promise.all(downloadPromises);
      for (const r of results) {
        if (r) downloadedImages.push(r);
      }

      console.log(`[analyze] Successfully downloaded ${downloadedImages.length}/${imageMatches.length} images`);
    }

    // Remove productImageMatches from the analysis response (internal use only)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { productImageMatches: _matches, ...cleanAnalysis } = analysis;

    return NextResponse.json({
      ...cleanAnalysis,
      downloadedProductImages: downloadedImages,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de l'analyse";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
