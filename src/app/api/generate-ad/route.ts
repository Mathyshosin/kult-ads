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
    } = await request.json();

    if (!brandAnalysis || !product || !format) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const aspectRatio = format === "square" ? "1:1" : "9:16";

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
      // Send both the template (for style) and the product image (for the actual product)

      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: "STYLE TEMPLATE - Use this as visual style reference ONLY",
      });

      if (productImageBase64) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: productImageMimeType || "image/png",
          label: "CLIENT PRODUCT PHOTO - This is the actual product to feature",
        });
      }

      visualPrompt = `You are a professional advertising designer. Your job is to create a new advertisement image.

TASK: Create a NEW ad that combines the STYLE of the template with the CLIENT'S PRODUCT.

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
${offer ? `\nPROMOTION:\n- ${offer.title}: ${offer.description}` : ""}

RULES:
1. The client's product (${product.name}) MUST be the hero/center of the image
2. Use the template's visual STYLE (backgrounds, mood, layout) but with the client's product
3. Make it look like a real, polished social media ad
4. DO NOT include any text, letters, words, or numbers in the image
5. Aspect ratio: ${aspectRatio}
6. High quality, professional advertising photography style`;
    } else {
      // ── FREE-FORM GENERATION (no template available) ──

      if (productImageBase64) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: productImageMimeType || "image/png",
          label: "PRODUCT PHOTO - Feature this product in the ad",
        });
      }

      visualPrompt = `You are a professional advertising designer. Create a stunning social media advertisement image.

PRODUCT:
- Name: ${product.name}
- Description: ${product.description}
- The product MUST be the central focus of the image

BRAND:
- Brand: ${brandAnalysis.brandName}
- Brand colors: ${brandAnalysis.colors?.length ? brandAnalysis.colors.join(", ") : "use modern, appealing colors"}
- Tone: ${brandAnalysis.tone || "professional"}
${offer ? `\nPROMOTION:\n- ${offer.title}: ${offer.description}` : ""}

STYLE:
- Modern, clean, high-end social media ad
- Professional product photography with beautiful lighting
- Eye-catching composition that makes people stop scrolling
- Lifestyle feel — the product should look desirable

RULES:
1. DO NOT include any text, letters, words, or numbers in the image
2. Aspect ratio: ${aspectRatio}
3. The product must be clearly visible and prominent
4. High quality, professional advertising photography`;
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
      timestamp: Date.now(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
