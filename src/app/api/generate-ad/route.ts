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
      concept,
    } = await request.json();

    if (!brandAnalysis || !product || !format) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const aspectRatio = format === "square" ? "1:1" : "9:16";

    // Use concept from Claude if provided
    const scenePrompt = concept?.scenePrompt
      || "The product displayed beautifully on a clean, minimal surface with soft professional lighting.";
    const copyAngle = concept?.copyAngle
      || "Mets en avant le bénéfice principal du produit.";
    const adType = concept?.adType || "bénéfice";

    // Pick a random template as STYLE reference
    const template = getRandomTemplateWithImage(format);

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
        label: "STYLE REFERENCE — match this ad layout style, colors, and professional quality",
      });
    }

    if (productImageBase64) {
      referenceImages.push({
        base64: productImageBase64,
        mimeType: productImageMimeType || "image/png",
        label: "PRODUCT PHOTO — integrate this exact product into the scene",
      });
    }

    // Short prompt: scene description + strict rules
    const visualPrompt = `Create a professional advertising image for "${brandAnalysis.brandName}".

${scenePrompt}

Use the PRODUCT PHOTO and place it naturally in the scene. Keep the product EXACTLY as shown — do not modify, redesign, or add anything to it.
${template ? "Match the style, quality and layout of the STYLE REFERENCE." : ""}
Brand colors: ${brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "use modern palette"}.
Photorealistic. NO text or letters. Aspect ratio: ${aspectRatio}.`;

    // Generate copy and image in parallel
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
        { error: "Échec de la génération de l'image" },
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
      conversionAngle: adType,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[generate-ad] ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
