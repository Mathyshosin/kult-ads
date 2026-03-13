import { NextResponse } from "next/server";
import { generateAdCopy } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage } from "@/lib/template-store";

export async function POST(request: Request) {
  try {
    const {
      brandAnalysis,
      product,
      offer,
      productImageBase64,
      productImageMimeType,
      format,
      // Dynamic concept from Claude (new system)
      concept,
    } = await request.json();

    if (!brandAnalysis || !product || !format) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const aspectRatio = format === "square" ? "1:1" : "9:16";

    // Use concept from Claude if provided, otherwise use a generic fallback
    const backgroundPrompt = concept?.backgroundPrompt
      || "Clean, minimal advertising background. Soft neutral tones, professional studio lighting. Elegant and modern.";
    const copyAngle = concept?.copyAngle
      || "Mets en avant le bénéfice principal du produit de manière percutante.";
    const adType = concept?.adType || "bénéfice";
    const layoutHint = concept?.layoutHint || "product-center";

    // Auto-pick a random template as style reference
    const template = getRandomTemplateWithImage(format);

    // Reference images: ONLY the template (NO product image — composited in CSS)
    const referenceImages: Array<{
      base64: string;
      mimeType: string;
      label: string;
    }> = [];

    if (template) {
      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: "STYLE REFERENCE",
      });
    }

    // Short, focused prompt using the concept's background description
    const visualPrompt = `Create a premium advertising BACKGROUND image for the brand "${brandAnalysis.brandName}".

A product will be composited on top later — DO NOT include any product, object, or item.
This is ONLY the background scene/atmosphere.

${backgroundPrompt}

Brand colors: ${brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "modern palette"}
${template ? "Use the STYLE REFERENCE for visual inspiration (colors, mood, style)." : ""}

Rules:
- Photorealistic, high-end advertising photography
- NO text, letters, words, or numbers anywhere
- NO products or objects — pure background/atmosphere
- Leave clear space where a product will be placed
- Aspect ratio: ${aspectRatio}`;

    // Run copy and background generation in parallel
    const [copyRaw, visualResult] = await Promise.all([
      generateAdCopy(
        brandAnalysis.brandName,
        brandAnalysis.tone,
        product.name,
        product.description,
        offer?.title,
        offer?.description,
        format,
        copyAngle
      ),
      generateImage(visualPrompt, aspectRatio, referenceImages),
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
        { error: "Échec de la génération du fond" },
        { status: 500 }
      );
    }

    // Map layoutHint to default product position
    const positionMap: Record<string, { preset: string; scale: number }> = {
      "product-center": { preset: "center", scale: 45 },
      "product-left": { preset: "center-left", scale: 40 },
      "product-right": { preset: "center-right", scale: 40 },
      "product-small-bottom": { preset: "bottom-center", scale: 30 },
    };
    const defaultPosition = positionMap[layoutHint] || positionMap["product-center"];

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
      conversionAngle: adType,
      timestamp: Date.now(),
      // Passthrough product image for compositing
      productImageBase64: productImageBase64 || undefined,
      productImageMimeType: productImageMimeType || undefined,
      productPosition: defaultPosition,
    });
  } catch (error) {
    console.error("[generate-ad] ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
