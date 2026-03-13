import { NextResponse } from "next/server";
import { generateAdCopy } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage } from "@/lib/template-store";

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

    // Auto-pick a random template from the admin library for this format
    const template = await getRandomTemplateWithImage(format);

    // Build the visual prompt — different if we have a template reference
    let visualPrompt: string;
    let referenceImageBase64: string | undefined;
    let referenceImageMimeType: string | undefined;

    if (template) {
      // Template-based generation: reproduce the template with client info
      visualPrompt = `Reproduce this exact ad template style, layout, and visual composition.
Replace the product shown with: ${product.name} - ${product.description}.
${offer ? `Include this promotional offer visually: ${offer.title} - ${offer.description}.` : ""}
Brand: ${brandAnalysis.brandName}.
Brand colors: ${brandAnalysis.colors?.join(", ") || "keep the template colors"}.
Keep the same visual structure, design elements, color scheme, and professional quality as the reference template.
DO NOT include any text or letters in the image - text will be added separately.
Format: ${aspectRatio}.`;
      referenceImageBase64 = template.imageBase64;
      referenceImageMimeType = template.mimeType;
    } else {
      // Free-form generation (no template in library)
      visualPrompt = `Create a professional, eye-catching advertising visual for the brand "${brandAnalysis.brandName}".
Product: ${product.name} - ${product.description}.
${offer ? `Current promotion: ${offer.title} - ${offer.description}` : ""}
Style: modern, clean, high-quality advertisement suitable for social media.
Brand colors: ${brandAnalysis.colors?.join(", ") || "use appealing colors"}.
The image should be visually striking and professional.
DO NOT include any text or letters in the image - text will be added separately.
Aspect ratio: ${aspectRatio}.`;
      referenceImageBase64 = productImageBase64;
      referenceImageMimeType = productImageMimeType;
    }

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
        referenceImageBase64,
        referenceImageMimeType
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
