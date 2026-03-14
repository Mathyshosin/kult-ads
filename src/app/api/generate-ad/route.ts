import { NextResponse } from "next/server";
import { generateAdCopy, describeTemplateScene } from "@/lib/claude";
import type { TemplateAnalysis } from "@/lib/claude";
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

    // ── Full brand context (shared between Claude calls) ──
    const brandContext = {
      brandName: brandAnalysis.brandName,
      brandDescription: brandAnalysis.brandDescription,
      tone: brandAnalysis.tone,
      targetAudience: brandAnalysis.targetAudience,
      uniqueSellingPoints: brandAnalysis.uniqueSellingPoints,
      productName: product.name,
      productDescription: product.description || "",
      productFeatures: product.features,
      offerTitle: offer?.title,
      offerDescription: offer?.description,
    };

    // ── Get template image (library mode only) ──
    const template = templateId
      ? getTemplateByIdWithImage(templateId)
      : customPrompt
        ? null
        : getRandomTemplateWithImage(format);

    // ── Build scene description ──
    let sceneDescription: string;
    let imageText: string | null = null;
    let isTextOnly = false;
    let templateAnalysis: TemplateAnalysis | null = null;

    if (customPrompt) {
      sceneDescription = customPrompt;
    } else if (template) {
      console.log("[generate-ad] Analyzing template with Claude...");
      templateAnalysis = await describeTemplateScene(
        template.imageBase64,
        template.mimeType,
        brandContext,
      );
      sceneDescription = templateAnalysis.scene;
      imageText = templateAnalysis.imageText;
      isTextOnly = templateAnalysis.isTextOnly;
      console.log("[generate-ad] Scene:", sceneDescription);
      console.log("[generate-ad] Image text:", imageText);
      console.log("[generate-ad] Text-only template:", isTextOnly);
      console.log("[generate-ad] Layout:", JSON.stringify(templateAnalysis.layout));
    } else {
      sceneDescription = "Product displayed on a clean minimal surface with soft professional studio lighting.";
    }

    // ── Reference images (ORDER MATTERS: product first, then layout) ──
    const referenceImages: Array<{
      base64: string;
      mimeType: string;
      label: string;
    }> = [];

    // Product photo FIRST so Gemini prioritizes it over the layout reference
    if (productImageBase64 && !isTextOnly) {
      referenceImages.push({
        base64: productImageBase64,
        mimeType: productImageMimeType || "image/png",
        label: `THIS IS THE ONLY PRODUCT FOR "${brandAnalysis.brandName}". Show this EXACT product — same shape, colors, packaging. Do NOT use any other product. Any product visible in the layout reference below is from a DIFFERENT brand and must NOT appear.`,
      });
    }

    // Layout reference SECOND — ONLY for text-only templates (no products to confuse Gemini)
    // For product templates, Gemini copies the template's products visually no matter what
    // the prompt says, so we rely on Claude's detailed layout description instead.
    if (template && isTextOnly) {
      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: `LAYOUT REFERENCE (from a DIFFERENT brand — NOT "${brandAnalysis.brandName}"). Copy ONLY the visual structure: background, element positions, text arrangement, decorative shapes. IGNORE all text, brand names, and logos in this image.`,
      });
    }

    // ── Gemini prompt ──
    let visualPrompt: string;
    const layout = templateAnalysis?.layout;

    if (template && layout && isTextOnly) {
      // ── Text-only template: layout reference image IS sent to Gemini ──
      visualPrompt = `${aspectRatio} — Create a text-only advertising image for "${brandAnalysis.brandName}".

Reproduce the EXACT layout from the LAYOUT REFERENCE image:
- Background: ${layout.backgroundStyle}
- Decorative elements: ${layout.decorativeElements}
- Text placement: ${layout.textPosition}
- Typography: ${layout.typographyStyle}
- CTA: ${layout.ctaStyle} at ${layout.ctaPosition}
- Brand name position: ${layout.brandLogoPosition}

TEXT (in French):
${imageText ? `"${imageText}"` : `Write compelling French ad text for "${brandAnalysis.brandName}".`}
Brand name EXACTLY: "${brandAnalysis.brandName}"

This is a TEXT-ONLY ad — NO product photos, NO physical objects, NO people. Only typography and graphic elements.

SCENE: ${sceneDescription}

RULES:
1. The ONLY brand name allowed is "${brandAnalysis.brandName}".
2. Brand colors: ${colors}.
${offer ? `3. DISCOUNT: Show "${offer.discountValue && offer.discountType === "percentage" ? `-${offer.discountValue}%` : offer.discountValue ? `-${offer.discountValue}€` : offer.title}".` : "3. No discount."}`;
    } else if (template && layout && !isTextOnly) {
      // ── Product template: NO layout reference image sent (Gemini copies products visually)
      //    Instead, use Claude's detailed layout description + product photo only ──
      const productDesc = [
        product.name,
        product.description ? `(${product.description})` : "",
        product.features?.length ? `— ${product.features.slice(0, 3).join(", ")}` : "",
      ].filter(Boolean).join(" ");

      visualPrompt = `${aspectRatio} — Create a professional advertising image for "${brandAnalysis.brandName}" selling "${product.name}".

PRODUCT: Look at the PRODUCT reference image. This is "${product.name}" — ${productDesc}.
${product.features?.length ? `Features: ${product.features.slice(0, 3).join(", ")}.` : ""}
Show this EXACT product faithfully — same shape, colors, packaging. Do NOT redesign it.
Display ONLY 1 or 2 units of this product, clean and simple. Do NOT create stacks, pyramids, or grids of products.

VISUAL STYLE:
- Background: ${layout.backgroundStyle}
- Decorative elements: ${layout.decorativeElements}
- Text placement: ${layout.textPosition}
- Typography: ${layout.typographyStyle}
- CTA: ${layout.ctaStyle} at ${layout.ctaPosition}
- Brand name position: ${layout.brandLogoPosition}
- Product area: ${layout.productPosition}

TEXT (in French):
${imageText ? `"${imageText}"` : `Write compelling French ad text for "${brandAnalysis.brandName}" — "${product.name}".`}
Brand name EXACTLY: "${brandAnalysis.brandName}"

SCENE: ${sceneDescription}

RULES:
1. Show ONLY "${product.name}" from the PRODUCT reference — 1 or 2 units max, elegantly displayed.
2. Do NOT create boxes, packaging, stacks, or multiple product arrangements. Keep it CLEAN and SIMPLE.
3. The ONLY brand name is "${brandAnalysis.brandName}".
4. Brand colors: ${colors}.
5. Photorealistic product, professional lighting, high-end advertising quality.
${offer ? `6. DISCOUNT: Show "${offer.discountValue && offer.discountType === "percentage" ? `-${offer.discountValue}%` : offer.discountValue ? `-${offer.discountValue}€` : offer.title}".` : "6. No discount. Highlight the strongest product benefit."}`;
    } else if (isTextOnly) {
      // Fallback text-only (no template ref)
      const textContent = imageText
        ? `The main headline text on the image MUST be: "${imageText}". Spell the brand name "${brandAnalysis.brandName}" EXACTLY like this.`
        : `Create compelling French text for "${brandAnalysis.brandName}" using their key selling points.`;

      visualPrompt = `${aspectRatio} bold graphic advertising design for "${brandAnalysis.brandName}".

Scene: ${sceneDescription}

This is a TEXT-FOCUSED graphic ad — NO product photography, NO physical objects.

RULES:
- This is a TYPOGRAPHIC / GRAPHIC design. Use bold typography, colors, shapes, patterns, gradients as the main visual.
- ${textContent}
- Colors: ${colors}. The design must feel premium and on-brand.
- Text must be large, readable, and the hero of the image.
- NO product photos, NO physical objects, NO people. Only typography and graphic elements.
- Professional graphic design quality, clean layout.`;
    } else {
      // Fallback product ad (no template ref)
      const textInstruction = imageText
        ? `Include this text prominently on the image in a bold, stylish font: "${imageText}". The brand name "${brandAnalysis.brandName}" must be spelled EXACTLY like this if it appears.`
        : `Do NOT include any text, words, letters, logos, or numbers in the image.`;

      visualPrompt = `${aspectRatio} professional advertising photo for "${brandAnalysis.brandName}".

Scene: ${sceneDescription}

RULES:
- The ONLY product allowed in this image is "${product.name}" from the PRODUCT reference. No other brand's products.
- Keep the product IDENTICAL to the PRODUCT reference — same shape, colors, packaging. Do NOT redesign it.
- Colors: ${colors}. Photorealistic, professional camera, high-end lighting.
${textInstruction}`;
    }

    // ── SEQUENTIAL: Image first, then copy ──
    const visualResult = await generateImage(visualPrompt, aspectRatio, referenceImages);

    if (!visualResult) {
      return NextResponse.json(
        { error: "Échec de la génération de l'image" },
        { status: 500 }
      );
    }

    // Copy angle
    const copyAngle = customPrompt
      ? `Adapte le texte à cette direction créative : ${customPrompt}`
      : imageText
        ? `Le texte "${imageText}" est déjà sur l'image. Complète avec un body text et CTA cohérents qui renforcent ce message.`
        : "Mets en avant le bénéfice le plus fort du produit avec les vrais arguments de la marque.";

    const copyRaw = await generateAdCopy(
      brandContext,
      format,
      copyAngle,
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
