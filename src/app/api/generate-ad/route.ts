import { NextResponse } from "next/server";
import { generateAdCopy } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage } from "@/lib/template-store";

// Conversion angles — each ad gets a different one
const CONVERSION_ANGLES = [
  {
    id: "fomo",
    label: "FOMO / Urgency",
    visualDirection:
      "Create urgency — use bold, attention-grabbing composition. Dramatic lighting, close-up of the product as if it's about to sell out. High contrast, energetic feel.",
    copyDirection:
      "Utilise l'urgence et la rareté (stock limité, dernière chance, offre qui expire). Crée un sentiment de FOMO.",
  },
  {
    id: "promo",
    label: "Promo / Offer",
    visualDirection:
      "Promotional feel — the product should look like an incredible deal. Bright, vibrant colors, festive/sale atmosphere. The product is the star surrounded by visual cues of value.",
    copyDirection:
      "Mets en avant l'offre promotionnelle, le prix barré, le pourcentage de réduction. Rends l'offre irrésistible.",
  },
  {
    id: "benefits",
    label: "Product Benefits",
    visualDirection:
      "Feature-focused — show the product in a way that highlights its quality and key features. Clean, editorial style. Detailed product shot with beautiful lighting that makes every detail visible.",
    copyDirection:
      "Mets en avant les bénéfices concrets du produit. Qu'est-ce que le client gagne ? Résous un problème. Sois spécifique.",
  },
  {
    id: "social-proof",
    label: "Social Proof",
    visualDirection:
      "Trust and popularity — show the product in a way that suggests many people love it. Warm, inviting composition. The product should look established, trusted, and popular. Lifestyle context with human element.",
    copyDirection:
      "Utilise la preuve sociale : avis clients, nombre de ventes, satisfaction. Montre que d'autres font confiance à ce produit.",
  },
  {
    id: "before-after",
    label: "Before / After",
    visualDirection:
      "Transformation visual — show the product as a solution. Split composition or dramatic reveal. Before: dull/problematic. After: vibrant/solved with the product as the hero. Strong visual contrast.",
    copyDirection:
      "Montre la transformation avant/après. Le problème sans le produit vs la solution avec. Contraste fort.",
  },
  {
    id: "lifestyle",
    label: "Lifestyle / Aspiration",
    visualDirection:
      "Aspirational lifestyle — show the product in a dream scenario. Beautiful setting, warm golden light, the product integrated into an ideal life. Make the viewer want this lifestyle.",
    copyDirection:
      "Vends le lifestyle, pas juste le produit. Projette le client dans une vie meilleure grâce au produit. Émotionnel et aspirationnel.",
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

    // Pick a conversion angle — rotate through them, never repeat in sequence
    const angleIdx =
      typeof variationIndex === "number"
        ? variationIndex % CONVERSION_ANGLES.length
        : Math.floor(Math.random() * CONVERSION_ANGLES.length);
    const angle = CONVERSION_ANGLES[angleIdx];

    // Auto-pick a random template from the admin library
    const template = getRandomTemplateWithImage(format);

    // Build reference images array and prompt
    let visualPrompt: string;
    const referenceImages: Array<{
      base64: string;
      mimeType: string;
      label: string;
    }> = [];

    if (template) {
      // ── TEMPLATE-BASED GENERATION ──
      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: "STYLE TEMPLATE - Use this as visual style reference ONLY",
      });

      if (productImageBase64) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: productImageMimeType || "image/png",
          label:
            "CLIENT PRODUCT PHOTO - This is the actual product to feature",
        });
      }

      visualPrompt = `You are an elite advertising designer specialized in high-converting social media ads.

TASK: Create a NEW ad that combines the STYLE of the template with the CLIENT'S PRODUCT, optimized for the "${angle.label}" conversion angle.

STYLE TEMPLATE (first image):
- Use this ONLY as a style/layout reference
- Copy the visual style: background style, color palette, composition, lighting mood, decorative elements
- DO NOT copy the product shown in the template — it is NOT the client's product
- DO NOT reproduce the template exactly — create something NEW inspired by it

CLIENT'S PRODUCT (second image if provided):
- Product name: ${product.name}
- Description: ${product.description}
- This is the ACTUAL product that MUST appear prominently in the ad
- If no product photo is provided, create a realistic representation of: ${product.name}

BRAND INFO:
- Brand: ${brandAnalysis.brandName}
- Brand colors: ${brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "use colors from the style template"}
- Tone: ${brandAnalysis.tone || "professional"}
- Target audience: ${brandAnalysis.targetAudience || "general consumer"}
${offer ? `\nPROMOTION: ${offer.title} — ${offer.description}` : ""}

CONVERSION ANGLE — "${angle.label}":
${angle.visualDirection}

CRITICAL RULES:
1. The client's product (${product.name}) MUST be the hero/center of the image
2. Use the template's visual STYLE (backgrounds, mood, layout) but with the client's product
3. Apply the "${angle.label}" conversion angle to the visual composition
4. Make it look like a REAL, polished social media ad that drives clicks
5. DO NOT include any text, letters, words, or numbers in the image — text is added separately
6. Aspect ratio: ${aspectRatio}
7. Professional advertising photography quality
8. This MUST look DIFFERENT from other ads — unique composition for this angle`;
    } else {
      // ── FREE-FORM GENERATION ──
      if (productImageBase64) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: productImageMimeType || "image/png",
          label: "PRODUCT PHOTO - Feature this product in the ad",
        });
      }

      visualPrompt = `You are an elite advertising designer specialized in high-converting social media ads.

TASK: Create a stunning ad for the "${angle.label}" conversion angle.

PRODUCT:
- Name: ${product.name}
- Description: ${product.description}
- The product MUST be the central focus of the image

BRAND:
- Brand: ${brandAnalysis.brandName}
- Brand colors: ${brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "use modern, appealing colors"}
- Tone: ${brandAnalysis.tone || "professional"}
- Target audience: ${brandAnalysis.targetAudience || "general consumer"}
${offer ? `\nPROMOTION: ${offer.title} — ${offer.description}` : ""}

CONVERSION ANGLE — "${angle.label}":
${angle.visualDirection}

CRITICAL RULES:
1. DO NOT include any text, letters, words, or numbers in the image
2. Aspect ratio: ${aspectRatio}
3. The product must be clearly visible and prominent
4. Professional advertising photography quality
5. Optimized for stopping the scroll on social media
6. This MUST look DIFFERENT from other ads — unique composition for this angle`;
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
        format,
        angle.copyDirection
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
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
