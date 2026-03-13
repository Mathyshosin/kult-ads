import { NextResponse } from "next/server";
import { generateAdCopy } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { brandAnalysis, product, offer, productImageBase64, productImageMimeType, format } =
      await request.json();

    if (!brandAnalysis || !product || !format) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const aspectRatio = format === "square" ? "1:1" : "9:16";

    // Build the visual prompt
    const visualPrompt = `Create a professional, eye-catching advertising visual for the brand "${brandAnalysis.brandName}".
Product: ${product.name} - ${product.description}.
${offer ? `Current promotion: ${offer.title} - ${offer.description}` : ""}
Style: modern, clean, high-quality advertisement suitable for social media.
Brand colors: ${brandAnalysis.colors?.join(", ") || "use appealing colors"}.
The image should be visually striking and professional.
DO NOT include any text or letters in the image - text will be added separately.
Aspect ratio: ${aspectRatio}.`;

    // Run copy and visual generation in parallel
    const [copyRaw, visualResult] = await Promise.all([
      generateAdCopy(
        brandAnalysis.brandName,
        brandAnalysis.tone,
        product.name,
        product.description,
        offer?.title,
        offer?.description,
        format
      ),
      generateImage(
        visualPrompt,
        aspectRatio,
        productImageBase64,
        productImageMimeType
      ),
    ]);

    // Parse copy
    let copy;
    try {
      copy = JSON.parse(copyRaw);
    } catch {
      const jsonMatch = copyRaw.match(/\{[\s\S]*\}/);
      copy = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : {
            headline: brandAnalysis.brandName,
            bodyText: product.description.slice(0, 60),
            callToAction: "Découvrir",
          };
    }

    if (!visualResult) {
      return NextResponse.json(
        { error: "Échec de la génération du visuel" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      format,
      imageBase64: visualResult.imageBase64,
      mimeType: visualResult.mimeType,
      headline: copy.headline,
      bodyText: copy.bodyText,
      callToAction: copy.callToAction,
      productId: product.id,
      offerId: offer?.id,
      timestamp: Date.now(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
