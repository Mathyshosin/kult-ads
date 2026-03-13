import { NextResponse } from "next/server";
import { generateAdCopy } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage } from "@/lib/template-store";

// Each angle = a different BACKGROUND atmosphere/mood
const CONVERSION_ANGLES = [
  {
    id: "fomo",
    label: "Urgency",
    scene: "Dramatic, urgent advertising backdrop. Dark moody atmosphere with bold accent lighting (red/orange glow). High contrast, cinematic tension. Think luxury flash-sale campaign.",
    copy: "Utilise l'urgence et la rareté (stock limité, dernière chance, offre qui expire). Crée un sentiment de FOMO.",
  },
  {
    id: "promo",
    label: "Promo",
    scene: "Festive, celebratory advertising backdrop. Bright clean background with confetti, sparkles, or geometric shapes. Premium sale atmosphere. Joyful and energetic colors.",
    copy: "Mets en avant l'offre promo, le prix barré, le pourcentage de réduction. Rends l'offre irrésistible.",
  },
  {
    id: "benefits",
    label: "Benefits",
    scene: "Clean, minimalist editorial backdrop. Pure white or soft neutral background with elegant lighting. Studio photography feel. Think Apple or Vogue ad — breathing room, luxury simplicity.",
    copy: "Mets en avant les bénéfices concrets du produit. Qu'est-ce que le client gagne ? Sois spécifique sur la valeur.",
  },
  {
    id: "social-proof",
    label: "Social Proof",
    scene: "Warm, inviting lifestyle backdrop. Cozy interior, beautiful table surface, or natural setting. Warm golden light, soft textures. Feels like home, trust, and comfort.",
    copy: "Utilise la preuve sociale : avis clients, nombre de ventes, satisfaction. Montre que d'autres font confiance.",
  },
  {
    id: "before-after",
    label: "Transformation",
    scene: "Split-tone dramatic backdrop. One side grey/muted/dull, the other side vibrant/colorful/alive. Strong visual contrast, like a before/after reveal. Transformation energy.",
    copy: "Montre la transformation avant/après. Le problème sans le produit vs la solution avec. Contraste émotionnel fort.",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    scene: "Dreamy aspirational backdrop. Beautiful real-world setting — luxury interior, tropical nature, or travel destination. Golden hour lighting, soft bokeh, cinematic color grading. Makes you desire this life.",
    copy: "Vends le lifestyle, pas le produit. Projette le client dans une vie meilleure. Émotionnel et aspirationnel.",
  },
];

export async function POST(request: Request) {
  try {
    const {
      brandAnalysis,
      product,
      offer,
      productImageBase64,
      productImageMimeType,
      format,
      variationIndex,
    } = await request.json();

    if (!brandAnalysis || !product || !format) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const aspectRatio = format === "square" ? "1:1" : "9:16";

    // Pick a conversion angle
    const angleIdx =
      typeof variationIndex === "number"
        ? variationIndex % CONVERSION_ANGLES.length
        : Math.floor(Math.random() * CONVERSION_ANGLES.length);
    const angle = CONVERSION_ANGLES[angleIdx];

    // Auto-pick a random template as style reference
    const template = getRandomTemplateWithImage(format);

    // Reference images: ONLY the template (NO product image — it will be composited in CSS)
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

    // Short, focused prompt — BACKGROUND ONLY, no product
    const visualPrompt = `Create a premium advertising BACKGROUND image for the brand "${brandAnalysis.brandName}".

A product will be composited on top later — DO NOT include any product, object, or item in this image.
This is ONLY the background scene/atmosphere.

Creative direction (${angle.label}): ${angle.scene}

Brand colors: ${brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "modern palette"}
${template ? "Use the STYLE REFERENCE for visual inspiration (colors, mood, style)." : ""}

Rules:
- Photorealistic, high-end advertising photography
- NO text, letters, words, or numbers
- NO products or objects — pure background/atmosphere
- Leave clear central space where a product will be placed
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
        angle.copy
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

    return NextResponse.json({
      id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      format,
      imageBase64: visualResult.imageBase64,     // Background only
      mimeType: visualResult.mimeType,
      headline: copy.headline,
      bodyText: copy.bodyText,
      callToAction: copy.callToAction,
      productId: product.id,
      offerId: offer?.id,
      conversionAngle: angle.id,
      timestamp: Date.now(),
      // Passthrough product image for compositing in the frontend
      productImageBase64: productImageBase64 || undefined,
      productImageMimeType: productImageMimeType || undefined,
      productPosition: { preset: "center", scale: 45 },
    });
  } catch (error) {
    console.error("[generate-ad] ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
