import { NextResponse } from "next/server";
import { generateAdCopy } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage, getTemplateByIdWithImage } from "@/lib/template-store";

export async function POST(request: Request) {
  try {
    const {
      brandAnalysis,
      product,
      offer,
      productImageBase64,
      productImageMimeType,
      format,
      // Mode: library (templateId) or custom (customPrompt)
      templateId,
      customPrompt,
    } = await request.json();

    if (!brandAnalysis || !product || !format) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const aspectRatio = format === "square" ? "1:1" : "9:16";

    // ── Get template image ──
    const template = templateId
      ? getTemplateByIdWithImage(templateId)
      : customPrompt
        ? null // Custom mode doesn't need a template
        : getRandomTemplateWithImage(format);

    // Reference images
    const referenceImages: Array<{
      base64: string;
      mimeType: string;
      label: string;
    }> = [];

    if (template) {
      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: "STYLE INSPIRATION — create a similar style ad for a different brand/product",
      });
    }

    if (productImageBase64) {
      referenceImages.push({
        base64: productImageBase64,
        mimeType: productImageMimeType || "image/png",
        label: "PRODUCT to feature in the ad",
      });
    }

    // ── Build Gemini prompt ──
    let visualPrompt: string;
    const colors = brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "modern, clean";

    // Product context for better prompt
    const productContext = `Product: ${product.name}${product.description ? ` — ${product.description}` : ""}`;

    if (customPrompt) {
      // Custom mode
      visualPrompt = `${aspectRatio} professional product photography for "${brandAnalysis.brandName}".
${productContext}

Scene: ${customPrompt}

The product must be naturally placed in the scene (on a surface, held in hands, worn, etc.) — NOT floating or pasted on. Keep the product identical to the PRODUCT reference image.
Photorealistic, professional lighting. Leave empty space for text overlay.
CRITICAL: Generate ZERO text, ZERO words, ZERO letters, ZERO logos, ZERO numbers anywhere in the image. The image must be purely photographic with no writing of any kind.`;
    } else {
      // Library mode
      visualPrompt = `${aspectRatio} professional product photography for "${brandAnalysis.brandName}".
${productContext}

Use the STYLE INSPIRATION only for mood and composition direction. Create a completely new photo featuring the PRODUCT reference naturally in a real scene (on a surface, held in hands, worn, etc.) — NOT floating or pasted on. Keep the product identical to the reference.
Colors: ${colors}. Photorealistic, professional lighting, shallow depth of field. Leave empty space for text overlay.
CRITICAL: Generate ZERO text, ZERO words, ZERO letters, ZERO logos, ZERO numbers anywhere in the image. The image must be purely photographic with no writing of any kind.`;
    }

    // ── SEQUENTIAL: Image first, then copy ──
    const visualResult = await generateImage(visualPrompt, aspectRatio, referenceImages);

    if (!visualResult) {
      return NextResponse.json(
        { error: "Échec de la génération de l'image" },
        { status: 500 }
      );
    }

    // Copy angle for Claude copywriting
    const copyAngle = customPrompt
      ? `Adapte le texte à cette direction créative : ${customPrompt}`
      : "Mets en avant le bénéfice principal du produit de manière percutante.";

    const copyRaw = await generateAdCopy(
      brandAnalysis.brandName,
      brandAnalysis.tone,
      product.name,
      product.description,
      offer?.title,
      offer?.description,
      format,
      copyAngle
    );

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
      templateId: templateId || null,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[generate-ad] ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
