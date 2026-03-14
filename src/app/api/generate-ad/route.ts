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
        label: "STYLE INSPIRATION — use this ad as inspiration for the overall layout, composition style, and visual mood. Do NOT copy it. Create a completely NEW image from scratch.",
      });
    }

    if (productImageBase64) {
      referenceImages.push({
        base64: productImageBase64,
        mimeType: productImageMimeType || "image/png",
        label: "PRODUCT — this is the exact product to feature in the new ad. Do NOT modify it.",
      });
    }

    // ── Build Gemini prompt ──
    let visualPrompt: string;

    if (customPrompt) {
      // Custom mode: user's own prompt, with safety rails
      visualPrompt = `Create a brand new ${aspectRatio} advertising photo from scratch for "${brandAnalysis.brandName}".

${customPrompt}

Rules:
- Create a COMPLETELY NEW image. Do NOT edit or modify any reference image.
- The PRODUCT from the reference must be the hero — feature it prominently as the clear focal point.
- Keep the product IDENTICAL to the PRODUCT reference — same packaging, colors, shape. Do NOT redesign, add ribbons, change labels, or alter it.
- If a person appears in the scene, they MUST be holding or wearing the product. Never a person next to the product without direct interaction.
- Photorealistic, shot on professional camera, shallow depth of field on background.
- Leave breathing room in the image (top or bottom third) for text overlay later.
- Absolutely NO text, words, letters, numbers, watermarks, or UI elements.`;
    } else {
      // Library mode: create NEW ad inspired by template style
      visualPrompt = `Create a brand new ${aspectRatio} advertising photo from scratch for "${brandAnalysis.brandName}".

Look at the STYLE INSPIRATION image and understand its visual approach: the type of composition, the mood, the lighting style, and the overall aesthetic. Then create a COMPLETELY NEW and DIFFERENT image that captures a similar vibe but features the PRODUCT from the reference photo.

CRITICAL: Do NOT copy, edit, or overlay the inspiration image. Generate an entirely new photograph from scratch. The only thing you take from the inspiration is the general aesthetic direction.

Rules:
- Create a COMPLETELY NEW image — do NOT paste the product onto the inspiration image.
- The PRODUCT from the reference must be the hero — feature it prominently as the clear focal point.
- Keep the product IDENTICAL to the PRODUCT reference — same packaging, colors, shape. Do NOT redesign it.
- Be inspired by the STYLE INSPIRATION's mood and composition type, but create a fresh, unique scene.
- If a person appears in the scene, they MUST be holding or wearing the product directly.
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
