import { NextResponse } from "next/server";
import { generateAdCopy } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage } from "@/lib/template-store";

// Each angle = a completely different ad creative concept
const CONVERSION_ANGLES = [
  {
    id: "fomo",
    label: "Urgency",
    scene: "Create an urgent, high-energy advertising scene. Dramatic lighting, dark moody background with bold accent colors. The product should feel exclusive and about to disappear. Think flash-sale campaign.",
    copy: "Utilise l'urgence et la rareté (stock limité, dernière chance, offre qui expire). Crée un sentiment de FOMO.",
  },
  {
    id: "promo",
    label: "Promo",
    scene: "Create a celebratory, premium sale scene. Clean bright background with festive elements (confetti, geometric shapes, sparkles). The product is the star — centered, well-lit, premium feel. Sale campaign vibes.",
    copy: "Mets en avant l'offre promo, le prix barré, le pourcentage de réduction. Rends l'offre irrésistible.",
  },
  {
    id: "benefits",
    label: "Benefits",
    scene: "Create a clean, editorial product scene. Minimalist background, beautiful studio lighting. Show the product like a luxury magazine ad — close up, every detail visible, aspirational. Think Vogue or Apple ad.",
    copy: "Mets en avant les bénéfices concrets du produit. Qu'est-ce que le client gagne ? Sois spécifique sur la valeur.",
  },
  {
    id: "social-proof",
    label: "Social Proof",
    scene: "Create a warm lifestyle scene where the product is being used or displayed naturally. Real-life context — on a beautiful table, in a cozy room, in someone's hands. Warm natural lighting. The product looks loved and desirable.",
    copy: "Utilise la preuve sociale : avis clients, nombre de ventes, satisfaction. Montre que d'autres font confiance.",
  },
  {
    id: "before-after",
    label: "Transformation",
    scene: "Create a dramatic transformation scene. Use split composition or strong contrast — one side dull and grey (the problem), the other side vibrant and colorful (with the product as the solution). Visual storytelling.",
    copy: "Montre la transformation avant/après. Le problème sans le produit vs la solution avec. Contraste émotionnel fort.",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    scene: "Create a dreamy aspirational scene. Beautiful real-world setting — luxury space, nature, or travel. Golden hour lighting, soft bokeh, cinematic color grading. The product is naturally part of this desirable lifestyle.",
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

    // Auto-pick a random template
    const template = getRandomTemplateWithImage(format);

    // Build reference images
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

    if (productImageBase64) {
      referenceImages.push({
        base64: productImageBase64,
        mimeType: productImageMimeType || "image/png",
        label: "PRODUCT",
      });
    }

    // Short, direct prompt that Gemini handles well
    const visualPrompt = `Create a high-end social media ad image for ${brandAnalysis.brandName}.

Product: ${product.name}${product.description ? ` — ${product.description}` : ""}
${offer ? `Offer: ${offer.title}` : ""}
Style: ${brandAnalysis.tone || "professional"}, brand colors: ${brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "modern palette"}

CREATIVE DIRECTION (${angle.label}):
${angle.scene}

${template ? "Use the STYLE REFERENCE image as inspiration for the visual style, background, and mood. Do NOT copy its product." : ""}
${productImageBase64 ? "Feature the PRODUCT from the reference photo — keep it recognizable but integrate it naturally into the scene." : `Feature the product: ${product.name}`}

Requirements:
- Photorealistic, professional advertising photography
- NO text, NO letters, NO words, NO numbers anywhere in the image
- The product must be the focal point
- Aspect ratio: ${aspectRatio}
- Make it scroll-stopping and premium`;

    // Run copy and visual generation in parallel
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
      conversionAngle: angle.id,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[generate-ad] ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
