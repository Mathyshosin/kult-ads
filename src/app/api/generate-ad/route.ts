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
      "MOOD: Urgency & scarcity. Use dramatic studio lighting with high contrast. Dark or bold background that creates tension. The product is lit with a spotlight effect as if it's the last one available. Subtle motion blur or dynamic angle to create energy.",
    copyDirection:
      "Utilise l'urgence et la rareté (stock limité, dernière chance, offre qui expire). Crée un sentiment de FOMO.",
  },
  {
    id: "promo",
    label: "Promo / Offer",
    visualDirection:
      "MOOD: Celebration & value. Bright, clean background (white, soft gradient, or brand color). The product is perfectly centered with professional e-commerce lighting. Festive but elegant atmosphere — confetti, sparkles or geometric shapes in the background. Premium sale vibes.",
    copyDirection:
      "Mets en avant l'offre promotionnelle, le prix barré, le pourcentage de réduction. Rends l'offre irrésistible.",
  },
  {
    id: "benefits",
    label: "Product Benefits",
    visualDirection:
      "MOOD: Clean & editorial. Minimalist white or neutral background. The product shot like a high-end magazine editorial — perfect lighting, every detail visible. Clean composition with lots of breathing room. Think Apple-style product photography.",
    copyDirection:
      "Mets en avant les bénéfices concrets du produit. Qu'est-ce que le client gagne ? Résous un problème. Sois spécifique.",
  },
  {
    id: "social-proof",
    label: "Social Proof",
    visualDirection:
      "MOOD: Warm & trustworthy. Soft, warm lighting. The product in a real-life context — on a table, held by hands, in a cozy environment. Lifestyle photography feel with natural light. The product looks loved and well-used. Warm color temperature.",
    copyDirection:
      "Utilise la preuve sociale : avis clients, nombre de ventes, satisfaction. Montre que d'autres font confiance à ce produit.",
  },
  {
    id: "before-after",
    label: "Before / After",
    visualDirection:
      "MOOD: Contrast & transformation. Split composition or strong visual contrast. One side muted/grey/dull (the problem), the other side vibrant/colorful (the solution with the product). The product bridges the gap as the hero element. Dramatic difference between both sides.",
    copyDirection:
      "Montre la transformation avant/après. Le problème sans le produit vs la solution avec. Contraste fort.",
  },
  {
    id: "lifestyle",
    label: "Lifestyle / Aspiration",
    visualDirection:
      "MOOD: Aspirational & dreamy. Beautiful real-world setting — luxury interior, nature, travel destination. Golden hour lighting, soft bokeh. The product is naturally integrated into this aspirational scene. Makes the viewer desire this lifestyle. Cinematic color grading.",
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
        label: "STYLE TEMPLATE - Copy the BACKGROUND STYLE and LAYOUT only",
      });

      if (productImageBase64) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: productImageMimeType || "image/png",
          label:
            "CLIENT PRODUCT PHOTO - Place this EXACT product in the ad WITHOUT any modification",
        });
      }

      visualPrompt = `You are a professional product photographer creating ultra-realistic advertising images.

YOUR GOAL: Create a PHOTOREALISTIC product ad by placing the client's product (from the second image) into a new background inspired by the template's style (first image).

═══ ABSOLUTE RULE — PRODUCT INTEGRITY ═══
The product in the second image MUST appear EXACTLY as-is in the final image.
- NEVER add anything to the product (no ribbons, no bows, no stickers, no tags, no accessories, no decorations)
- NEVER change the product's color, shape, texture, or proportions
- NEVER add text, watermarks, stamps, badges, or labels ON the product
- NEVER modify the product in ANY way — treat it as a sacred, untouchable element
- Simply PLACE the product as-is onto the new background
- The product should look like it was professionally photographed in this new setting

═══ STYLE REFERENCE (first image) ═══
Look at the template image and take inspiration from:
- The background style, colors, and mood
- The overall composition and layout
- The lighting direction and atmosphere
Do NOT copy the template's product — only its visual environment.

═══ PHOTOREALISM REQUIREMENTS ═══
- The final image MUST look like a real photograph, NOT an illustration or cartoon
- Use realistic lighting, shadows, and reflections consistent with the scene
- Professional studio/advertising photography quality
- Real textures, real materials, real physics
- If you see the product has a specific finish (matte, glossy, fabric, etc.), preserve it exactly
- Natural color grading — no oversaturated or fantasy colors

═══ SCENE SETUP ═══
- Product: ${product.name} — ${product.description}
- Brand: ${brandAnalysis.brandName}
- Brand colors for the BACKGROUND only: ${brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "use colors from the style template"}
- Tone: ${brandAnalysis.tone || "professional"}
${offer ? `- Promotion context: ${offer.title}` : ""}

═══ CONVERSION ANGLE — "${angle.label}" ═══
${angle.visualDirection}

═══ FINAL CHECKLIST ═══
1. The product is IDENTICAL to the client's photo — nothing added, nothing changed
2. The image looks like a REAL PHOTOGRAPH (not illustration, not cartoon, not 3D render)
3. NO text, letters, words, numbers, or symbols anywhere in the image
4. Aspect ratio: ${aspectRatio}
5. The background and mood match the "${angle.label}" conversion angle
6. Professional advertising photography that could run on Instagram/Facebook`;
    } else {
      // ── FREE-FORM GENERATION ──
      if (productImageBase64) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: productImageMimeType || "image/png",
          label: "CLIENT PRODUCT PHOTO - Place this EXACT product in the ad WITHOUT any modification",
        });
      }

      visualPrompt = `You are a professional product photographer creating ultra-realistic advertising images.

YOUR GOAL: Create a PHOTOREALISTIC product advertisement image.

═══ ABSOLUTE RULE — PRODUCT INTEGRITY ═══
If a product photo is provided, it MUST appear EXACTLY as-is in the final image.
- NEVER add anything to the product (no ribbons, no bows, no stickers, no tags, no accessories)
- NEVER change the product's color, shape, texture, or proportions
- NEVER add text, watermarks, stamps, or labels ON the product
- Simply PLACE the product as-is onto a beautiful advertising background

═══ PHOTOREALISM REQUIREMENTS ═══
- The final image MUST look like a real photograph taken by a professional photographer
- NOT an illustration, NOT a cartoon, NOT a 3D render, NOT digital art
- Real lighting with natural shadows and reflections
- Real textures and materials
- Professional studio or on-location advertising photography

═══ SCENE SETUP ═══
- Product: ${product.name} — ${product.description}
- Brand: ${brandAnalysis.brandName}
- Brand colors for BACKGROUND: ${brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "use modern, appealing colors"}
- Tone: ${brandAnalysis.tone || "professional"}
${offer ? `- Promotion context: ${offer.title}` : ""}

═══ CONVERSION ANGLE — "${angle.label}" ═══
${angle.visualDirection}

═══ FINAL CHECKLIST ═══
1. Product is IDENTICAL to the provided photo — nothing added, nothing changed
2. Image looks like a REAL PHOTOGRAPH
3. NO text, letters, words, numbers, or symbols anywhere
4. Aspect ratio: ${aspectRatio}
5. Background mood matches "${angle.label}" angle
6. Professional quality ready for Instagram/Facebook ads`;
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
    console.error("[generate-ad] ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
