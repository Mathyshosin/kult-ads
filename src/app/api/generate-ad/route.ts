import { NextResponse } from "next/server";
import { generateAdCopy, describeTemplateScene } from "@/lib/claude";
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
    const colors = brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "modern, clean";

    // ── Get template image (library mode only) ──
    const template = templateId
      ? getTemplateByIdWithImage(templateId)
      : customPrompt
        ? null
        : getRandomTemplateWithImage(format);

    // ── Build scene description ──
    let sceneDescription: string;

    if (customPrompt) {
      // Custom mode: user's own prompt
      sceneDescription = customPrompt;
    } else if (template) {
      // Library mode: Claude analyzes the template and describes the scene
      console.log("[generate-ad] Analyzing template with Claude...");
      sceneDescription = await describeTemplateScene(
        template.imageBase64,
        template.mimeType,
        product.name,
        product.description || "",
      );
      console.log("[generate-ad] Scene description:", sceneDescription);
    } else {
      // Fallback
      sceneDescription = "Product displayed on a clean minimal surface with soft professional studio lighting.";
    }

    // ── Reference images: only the product photo ──
    const referenceImages: Array<{
      base64: string;
      mimeType: string;
      label: string;
    }> = [];

    if (productImageBase64) {
      referenceImages.push({
        base64: productImageBase64,
        mimeType: productImageMimeType || "image/png",
        label: "PRODUCT to feature in the ad — keep it identical, do not modify",
      });
    }

    // ── Gemini prompt: always a concrete scene description ──
    const visualPrompt = `${aspectRatio} professional advertising photo for "${brandAnalysis.brandName}".
Product: ${product.name}

Scene: ${sceneDescription}

The product must appear naturally in the scene. Keep it identical to the PRODUCT reference.
Colors: ${colors}. Photorealistic, professional lighting.
CRITICAL: ZERO text, words, letters, logos, or numbers in the image.`;

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
