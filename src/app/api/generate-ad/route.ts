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
    // If templateId is provided, use that specific template
    // Otherwise fall back to random (shouldn't happen in new flow)
    const template = templateId
      ? getTemplateByIdWithImage(templateId)
      : getRandomTemplateWithImage(format);

    // Reference images: template (style) + product photo (to integrate)
    const referenceImages: Array<{
      base64: string;
      mimeType: string;
      label: string;
    }> = [];

    if (template) {
      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: "STYLE REFERENCE — replicate this exact ad style, composition and professional quality",
      });
    }

    if (productImageBase64) {
      referenceImages.push({
        base64: productImageBase64,
        mimeType: productImageMimeType || "image/png",
        label: "PRODUCT — this is the exact product to feature. Do NOT modify it.",
      });
    }

    // ── Build Gemini prompt ──
    let visualPrompt: string;

    if (customPrompt) {
      // Custom mode: user's own prompt, with safety rails
      visualPrompt = `High-end ${aspectRatio} advertising photo for "${brandAnalysis.brandName}".

${customPrompt}

Rules:
- The PRODUCT is the hero. Feature it prominently, it must be the clear focal point.
- Keep the product IDENTICAL to the PRODUCT reference — same packaging, colors, shape. Do NOT redesign, add ribbons, change labels, or alter it.
- If a person appears in the scene, they MUST be holding or wearing the product. Never a person next to the product without direct interaction.
- Photorealistic, shot on professional camera, shallow depth of field on background.
- Leave breathing room in the image (top or bottom third) for text overlay later.
- Absolutely NO text, words, letters, numbers, watermarks, or UI elements.`;
    } else {
      // Library mode: replicate the template style
      visualPrompt = `High-end ${aspectRatio} advertising photo for "${brandAnalysis.brandName}".

Replicate the STYLE REFERENCE exactly — same composition, layout, lighting, and professional quality — but adapted for this brand and product.

Rules:
- The PRODUCT is the hero. Feature it prominently, it must be the clear focal point.
- Keep the product IDENTICAL to the PRODUCT reference — same packaging, colors, shape. Do NOT redesign, add ribbons, change labels, or alter it.
- Copy the STYLE REFERENCE composition, lighting style, and professional quality as closely as possible.
- If a person appears in the scene, they MUST be holding or wearing the product. Never a person next to the product without direct interaction.
- Leave breathing room in the image (top or bottom third) for text overlay later.
- Color palette: ${brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "modern, clean"}.
- Photorealistic, shot on professional camera, shallow depth of field on background.
- Absolutely NO text, words, letters, numbers, watermarks, or UI elements.`;
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
