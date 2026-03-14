import { NextResponse } from "next/server";
import { generateAdCopy, describeTemplateScene } from "@/lib/claude";
import type { TemplateAnalysis } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage, getTemplateByIdWithImage } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const {
      brandAnalysis,
      product,
      offer,
      productImageBase64,
      productImageMimeType,
      brandLogoBase64,
      brandLogoMimeType,
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
      competitorProducts: brandAnalysis.competitorProducts,
      productName: product.name,
      productDescription: product.description || "",
      productFeatures: product.features,
      productPrice: product.price,
      productOriginalPrice: offer?.originalPrice || product.originalPrice,
      productSalePrice: offer?.salePrice || product.salePrice,
      offerTitle: offer?.title,
      offerDescription: offer?.description,
    };

    // ── Get template image (library mode only) ──
    const template = templateId
      ? getTemplateByIdWithImage(templateId)
      : customPrompt
        ? null
        : getRandomTemplateWithImage(format);

    // Track the actual template ID used (important for random templates)
    const actualTemplateId = template?.id || templateId || null;

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

      // ── Safety filter: strip prices from imageText if template has no price area ──
      if (imageText && !templateAnalysis.templateHasPrices) {
        // Remove lines containing price patterns: "Price: XX", "Prix: XX", "XX€", "XX,XX€"
        imageText = imageText
          .split("\n")
          .filter((line) => !/(?:price|prix)\s*[:：]/i.test(line) && !/\d+[.,]?\d*\s*€/.test(line))
          .join("\n");
        console.log("[generate-ad] Stripped prices from imageText (template has no prices)");
      }

      console.log("[generate-ad] Scene:", sceneDescription);
      console.log("[generate-ad] Image text:", imageText);
      console.log("[generate-ad] Text-only template:", isTextOnly);
      console.log("[generate-ad] Template has prices:", templateAnalysis.templateHasPrices);
      console.log("[generate-ad] Template text count:", templateAnalysis.templateTextCount);
      console.log("[generate-ad] Template type:", templateAnalysis.templateType);
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
        label: `THIS IS THE ONLY PRODUCT FOR "${brandAnalysis.brandName}". Show this EXACT product — same shape, colors, packaging. Do NOT use any other product. NEVER add labels, stickers, tags, text, or any overlay ON the product itself — show it exactly as-is in the photo. NEVER create, invent, or redesign the product packaging — use ONLY the packaging visible in this reference photo. Do NOT add boxes, bottles, containers, or any packaging that is not in this image. Any product visible in the layout reference below is from a DIFFERENT brand and must NOT appear.`,
      });
    }

    // Brand logo reference — so Gemini uses the real logo instead of generating one
    if (brandLogoBase64) {
      referenceImages.push({
        base64: brandLogoBase64,
        mimeType: brandLogoMimeType || "image/png",
        label: `THIS IS THE OFFICIAL LOGO for "${brandAnalysis.brandName}". Use this EXACT logo when showing the brand name/logo on the ad. Do NOT create, invent, or generate a different logo — use ONLY this one, reproduced faithfully. CRITICAL LOGO RULES: Do NOT modify the logo in ANY way — no font change, no color change, no outline, no shadow, no badge, no background shape, no resize distortion. Place it EXACTLY as uploaded with ZERO modifications. If it's hard to see against the background, place it on a contrasting area of the background instead of changing the logo itself.`,
      });
    }

    // Layout reference — ONLY for text-only templates (no products to confuse Gemini)
    // For product templates, Gemini copies the template's products visually no matter what
    // the prompt says, so we rely on Claude's detailed layout description instead.
    if (template && isTextOnly) {
      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: `LAYOUT REFERENCE (from a DIFFERENT brand — NOT "${brandAnalysis.brandName}"). Copy ONLY the visual structure: background, element positions, text arrangement, decorative shapes. IGNORE all text, brand names, and logos in this image.`,
      });
    }

    // ── Price info: offer prices take priority over product prices ──
    const priceInfo = (() => {
      // If offer has its own pricing, use that (e.g. pack pricing)
      const origPrice = offer?.originalPrice || product.originalPrice;
      const saleP = offer?.salePrice || product.salePrice;

      if (origPrice && saleP) {
        return `PRICING (from the brand's website — use these EXACT numbers): Original price: ${origPrice} → Sale price: ${saleP}. Show both prices: the original price crossed out and the sale price highlighted.`;
      } else if (saleP) {
        return `PRICING (from the brand's website — use this EXACT number): Sale price: ${saleP}.`;
      } else if (product.price) {
        return `PRICING (from the brand's website — use this EXACT number): Price: ${product.price}.`;
      }
      return null;
    })();

    // ── Logo instruction ──
    const logoInstruction = brandLogoBase64
      ? `Use the EXACT brand logo from the LOGO reference image for "${brandAnalysis.brandName}". Do NOT generate or invent a logo. Do NOT modify the logo in ANY way — no font change, no color change, no outline, no shadow, no additions. ZERO modifications. Place it as-is.`
      : `If showing a brand name/logo, write "${brandAnalysis.brandName}" in clean typography. Do NOT invent a logo graphic.`;

    // ── Gemini prompt ──
    let visualPrompt: string;
    const layout = templateAnalysis?.layout;

    if (template && layout && isTextOnly) {
      // ── Text-only template: layout reference image IS sent to Gemini ──
      const discountStr = offer
        ? (offer.discountValue && offer.discountType === "percentage"
          ? `-${offer.discountValue}%`
          : offer.discountValue
            ? `-${offer.discountValue}€`
            : offer.title)
        : null;

      visualPrompt = `${aspectRatio} — Create a text-only advertising image for "${brandAnalysis.brandName}".

Reproduce the EXACT layout from the LAYOUT REFERENCE image:
- Background: ${layout.backgroundStyle}
- Decorative elements: ${layout.decorativeElements}
- Text placement: ${layout.textPosition}
- Typography: ${layout.typographyStyle}
- CTA: ${layout.ctaStyle} at ${layout.ctaPosition}
- Brand name position: ${layout.brandLogoPosition}

TEXT ON IMAGE (in French — display ONLY this text, nothing more):
${imageText ? `"${imageText}"` : `"${brandAnalysis.brandName}"`}

This is a TEXT-ONLY ad — NO product photos, NO physical objects, NO people.

SCENE: ${sceneDescription}

STRICT RULES:
1. The ONLY brand name is "${brandAnalysis.brandName}".
2. ${logoInstruction}
3. Brand colors: ${colors}.
${discountStr ? `4. DISCOUNT: Show "${discountStr}" prominently. No extra dashes.` : "4. No discount."}
5. Display ONLY the text provided above. Do NOT add extra text, bullet points, descriptions, or prices not specified above.`;
    } else if (template && layout && !isTextOnly && templateAnalysis?.templateType === "comparison") {
      // ── COMPARISON / VS template ──
      const competitors = brandAnalysis.competitorProducts?.length
        ? brandAnalysis.competitorProducts.slice(0, 2).join(" ou ")
        : "le produit concurrent traditionnel";

      const showPrices = templateAnalysis?.templateHasPrices && priceInfo;
      const discountStr = offer
        ? (offer.discountValue && offer.discountType === "percentage"
          ? `-${offer.discountValue}%`
          : offer.discountValue
            ? `-${offer.discountValue}€`
            : offer.title)
        : null;

      visualPrompt = `${aspectRatio} — Create a COMPARISON / VS advertising image for "${brandAnalysis.brandName}".

SPLIT LAYOUT: ${layout.comparisonLayout || "left = bad alternative, right = good brand product"}

BAD SIDE: Show a GENERIC ${competitors} — unappealing, dull.
GOOD SIDE: Show EXACTLY 1 unit of "${product.name}" from the PRODUCT reference — clean, premium, desirable. FULLY VISIBLE.

LAYOUT:
- Background: ${layout.backgroundStyle}
- Typography: ${layout.typographyStyle}
- Brand name position: ${layout.brandLogoPosition}

TEXT ON IMAGE (in French — display ONLY this text):
${imageText ? `"${imageText}"` : `"${brandAnalysis.brandName}"`}

SCENE: ${sceneDescription}

STRICT RULES:
1. Clear visual comparison — two distinct sides.
2. GOOD side: EXACTLY 1 unit of "${product.name}" from PRODUCT reference. Never cropped.
3. ${logoInstruction}
4. Brand colors: ${colors}.
${discountStr ? `5. DISCOUNT: Show "${discountStr}" prominently. No extra dashes.` : "5. No discount."}
${showPrices ? `6. ${priceInfo}` : "6. NO PRICES anywhere on the image."}
7. NEVER add labels or text ON the product.
8. Display ONLY the text provided above. No extra text, no bullet points, no feature lists.`;
    } else if (template && layout && !isTextOnly) {
      // ── Product template: NO layout reference image sent (Gemini copies products visually)
      //    Instead, use Claude's detailed layout description + product photo only ──

      // Only show prices if Claude detected them on the template AND we have real prices
      const showPrices = templateAnalysis?.templateHasPrices && priceInfo;

      // Build discount string cleanly
      const discountStr = offer
        ? (offer.discountValue && offer.discountType === "percentage"
          ? `-${offer.discountValue}%`
          : offer.discountValue
            ? `-${offer.discountValue}€`
            : offer.title)
        : null;

      visualPrompt = `${aspectRatio} — Create a professional advertising image for "${brandAnalysis.brandName}" selling "${product.name}".

PRODUCT: Look at the PRODUCT reference image. Show this EXACT product — same shape, same colors, same packaging.
- Display EXACTLY 1 unit of this product. NOT 2, NOT a stack, NOT multiple colors.
- The product MUST be FULLY VISIBLE — never cropped or cut off.
- NEVER create or invent packaging. Use ONLY what's in the reference photo.
- NEVER add labels, stickers, or text ON the product.

LAYOUT:
- Background: ${layout.backgroundStyle}
- Decorative elements: ${layout.decorativeElements}
- Text placement: ${layout.textPosition}
- Typography: ${layout.typographyStyle}
- CTA: ${layout.ctaStyle} at ${layout.ctaPosition}
- Brand name position: ${layout.brandLogoPosition}
- Product area: ${layout.productPosition}

TEXT ON IMAGE (in French — display ONLY this text, nothing more):
${imageText ? `"${imageText}"` : `"${brandAnalysis.brandName}"`}

SCENE: ${sceneDescription}

STRICT RULES:
1. Show EXACTLY 1 unit of "${product.name}" from the PRODUCT reference. ONE. Not two, not multiple colors.
2. ${logoInstruction}
3. Brand colors: ${colors}.
4. The ONLY brand name is "${brandAnalysis.brandName}".
${discountStr ? `5. DISCOUNT: Show "${discountStr}" prominently. Write it exactly as shown — no extra dashes.` : "5. No discount on this ad."}
${showPrices ? `6. ${priceInfo}` : "6. NO PRICES on this image. Do NOT show any price, € symbol, or monetary amount anywhere."}
7. Display ONLY the text provided above. Do NOT add extra text, bullet points, feature lists, product descriptions, or any text not specified above.
8. If the text above includes annotations with arrows/lines, each annotation MUST point to the correct part of the product.
9. Photorealistic product, professional lighting, high-end advertising quality.`;
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
- The product must be FULLY VISIBLE and well-positioned — NEVER cropped, cut off, or bleeding past image edges. Leave clear margins.
- NEVER add labels, stickers, tags, text, or ANY overlay directly ON the product — show it exactly as-is.
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
      templateId: actualTemplateId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[generate-ad] ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
