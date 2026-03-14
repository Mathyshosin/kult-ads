import { NextResponse } from "next/server";
import { generateAdCopy, describeTemplateScene } from "@/lib/claude";
import type { TemplateAnalysis } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage, getTemplateByIdWithImage } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTemplateAnalysisFromDb, saveTemplateAnalysisToDb } from "@/lib/supabase/template-analysis";
import { analyzeTemplateMetadata } from "@/lib/claude";

/** Sanitize discount string: fix double dashes and double percent signs */
function cleanDiscount(raw: string): string {
  return raw
    .replace(/--+/g, "-")   // "--60%" → "-60%"
    .replace(/%%+/g, "%");  // "-60%%" → "-60%"
}

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
      ? await getTemplateByIdWithImage(templateId)
      : customPrompt
        ? null
        : await getRandomTemplateWithImage(format);

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
      // Fetch pre-computed analysis from Supabase (or analyze + cache on first use)
      let precomputedAnalysis = await getTemplateAnalysisFromDb(template.id);

      if (!precomputedAnalysis) {
        // First time using this template → analyze and save to Supabase for future use
        console.log(`[generate-ad] No cached metadata for ${template.id}, analyzing and caching...`);
        precomputedAnalysis = await analyzeTemplateMetadata(template.imageBase64, template.mimeType);
        // Save in background (don't block ad generation)
        saveTemplateAnalysisToDb(template.id, precomputedAnalysis).catch((err) =>
          console.error("[generate-ad] Failed to cache template analysis:", err)
        );
        console.log(`[generate-ad] Template ${template.id} analyzed and cached to Supabase`);
      } else {
        console.log(`[generate-ad] Using cached metadata from Supabase for ${template.id}`);
      }

      templateAnalysis = await describeTemplateScene(
        template.imageBase64,
        template.mimeType,
        brandContext,
        precomputedAnalysis,
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

      // ── Safety filter: fix formatting glitches in discount/percentage text ──
      if (imageText) {
        imageText = imageText
          .replace(/--+(\d)/g, "-$1")   // "--60%" or "---60%" → "-60%"
          .replace(/%%+/g, "%")          // "-60%%" → "-60%"
          .replace(/(\d)%%/g, "$1%");    // "60%%" → "60%"
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
    // BUT: only include if NOT text-only AND template actually shows a product
    const templateShowsProduct = templateAnalysis?.templateHasProductPhoto !== false;
    if (productImageBase64 && !isTextOnly && templateShowsProduct) {
      referenceImages.push({
        base64: productImageBase64,
        mimeType: productImageMimeType || "image/png",
        label: `THIS IS THE ONLY PRODUCT FOR "${brandAnalysis.brandName}". Show this EXACT product — same shape, colors, appearance. Do NOT use any other product.
ABSOLUTE RULES FOR THE PRODUCT:
- Show the product EXACTLY as it appears in this photo — no modifications whatsoever.
- NEVER write text, percentages, prices, or ANY overlay ON the product surface. The product must be clean.
- NEVER create, invent, or add packaging (no box, no bag, no sachet, no wrapper, no container). If the product in this photo has no packaging, show it WITHOUT packaging.
- NEVER show a person holding a miniature version of the product or a card/flyer with the product on it.
- The product should be displayed as a standalone item, not wrapped or contained in anything not visible in this reference.
Any product visible in the layout reference below is from a DIFFERENT brand and must NOT appear.`,
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

    // ── Discount string (computed once, sanitized) ──
    const discountStr = offer
      ? cleanDiscount(
          offer.discountValue && offer.discountType === "percentage"
            ? `-${offer.discountValue}%`
            : offer.discountValue
              ? `-${offer.discountValue}€`
              : (offer.title || "")
        ) || null
      : null;

    // Only show prices if Claude detected them on the template AND we have real prices
    const showPrices = templateAnalysis?.templateHasPrices && priceInfo;

    // Check if discount is already embedded in imageText (avoid Gemini showing it twice)
    const discountAlreadyInText = !!(discountStr && imageText && imageText.includes(discountStr));

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
- Headline style: ${layout.headlineStyle}${layout.subheadlineStyle ? `\n- Subheadline style: ${layout.subheadlineStyle}` : ""}
- Text color: ${layout.textColor}${layout.accentColor ? ` | Accent color: ${layout.accentColor}` : ""}
- CTA: ${layout.ctaStyle} at ${layout.ctaPosition}
- Brand name position: ${layout.brandLogoPosition}
${layout.textAreaPercent ? `- Text area: ${layout.textAreaPercent}` : ""}
${layout.margins ? `- Margins: ${layout.margins}` : ""}

TEXT ON IMAGE (in French — display ONLY this text, nothing more):
${imageText ? `"${imageText}"` : `"${brandAnalysis.brandName}"`}

This is a TEXT-ONLY ad — NO product photos, NO physical objects, NO people.

SCENE: ${sceneDescription}

STRICT RULES:
1. The ONLY brand name is "${brandAnalysis.brandName}".
2. ${logoInstruction}
3. Brand colors: ${colors}.
${discountStr && !discountAlreadyInText ? `4. DISCOUNT: Show "${discountStr}" prominently. No extra dashes. Show it ONLY ONCE.` : "4. No extra discount text needed — it's already in the text above (or there is none)."}
5. Display ONLY the text provided above. Do NOT add extra text, bullet points, descriptions, or prices not specified above. NEVER show any text element twice — each piece of text must appear exactly ONCE.
6. Match the EXACT proportions and spacing from the layout reference — text sizes, margins, element positions must be faithful to the original template.
7. ALL text on the image MUST be in FRENCH. Never use English words (except the brand name if it's in English).`;
    } else if (template && layout && !isTextOnly && templateAnalysis?.templateType === "comparison") {
      // ── COMPARISON / VS template ──
      const competitors = brandAnalysis.competitorProducts?.length
        ? brandAnalysis.competitorProducts.slice(0, 2).join(" ou ")
        : "le produit concurrent traditionnel";

      const productCategory = product.description || product.name;

      visualPrompt = `${aspectRatio} — Create a COMPARISON / VS advertising image for "${brandAnalysis.brandName}".

SPLIT LAYOUT: ${layout.comparisonLayout || "left = bad alternative, right = good brand product"}

BAD SIDE: Show a generic, unappealing version of the OLD/INFERIOR alternative in the SAME product category as "${product.name}" (${productCategory}).
- CRITICAL: Do NOT copy the template's specific objects (if the template shows a crushed can, a bottle, etc. from another industry — IGNORE those). Instead show a relevant inferior product from "${product.name}"'s actual category.
- Make it look dull, uncomfortable, outdated, or wasteful — visually unappealing.
GOOD SIDE: Show EXACTLY 1 unit of "${product.name}" from the PRODUCT reference — clean, premium, desirable. FULLY VISIBLE.
- Show the product EXACTLY as it appears in the PRODUCT reference photo — same shape, same colors, same appearance.
- ABSOLUTELY FORBIDDEN: Do NOT invent, create, or add ANY object that is NOT in the PRODUCT reference. No packaging, no bags, no wrappers, no hands holding the product, no hands holding fabric/cloth/material, no additional items whatsoever.
- ABSOLUTELY FORBIDDEN: Do NOT add any person, hand, arm, or human body part on the GOOD side. The product stands alone — no one touches it, holds it, or interacts with it.
- NEVER write text or percentages ON the product surface.

LAYOUT:
- Background: ${layout.backgroundStyle}
- Typography: ${layout.typographyStyle}
- Headline style: ${layout.headlineStyle}${layout.subheadlineStyle ? `\n- Subheadline style: ${layout.subheadlineStyle}` : ""}
- Text color: ${layout.textColor}${layout.accentColor ? ` | Accent color: ${layout.accentColor}` : ""}
- Brand name position: ${layout.brandLogoPosition}
${layout.margins ? `- Margins: ${layout.margins}` : ""}

TEXT ON IMAGE (in French — display ONLY this text):
${imageText ? `"${imageText}"` : `"${brandAnalysis.brandName}"`}

SCENE: ${sceneDescription}

STRICT RULES:
1. Clear visual comparison — two distinct sides.
2. BAD side: Must show a product from the SAME CATEGORY as "${product.name}". NOT a random object from the template.
3. GOOD side: EXACTLY 1 unit of "${product.name}" from PRODUCT reference. Never cropped. Show ONLY the product itself — NO hands, NO arms, NO person holding or touching it. NO invented objects. ONLY what is visible in the PRODUCT reference photo.
4. ${logoInstruction}
5. Brand colors: ${colors}.
${discountStr && !discountAlreadyInText ? `6. DISCOUNT: Show "${discountStr}" prominently. No extra dashes. Show it ONLY ONCE.` : "6. No extra discount text needed."}
${showPrices ? `7. ${priceInfo}` : "7. NO PRICES anywhere on the image."}
8. NEVER add labels or text ON the product.
9. Display ONLY the text provided above. No extra text, no bullet points, no feature lists. NEVER show any text element twice.
10. ALL text on the image MUST be in FRENCH. Never use English words (except the brand name if it's in English).`;
    } else if (template && layout && !isTextOnly) {
      // ── Product template: NO layout reference image sent (Gemini copies products visually)
      //    Instead, use Claude's detailed layout description + product photo only ──

      const noHuman = !templateAnalysis?.templateHasHumanModel;
      const noProduct = !templateShowsProduct;

      const productSection = noProduct
        ? `This ad does NOT show a product photo — it uses only text, shapes, and graphics to advertise "${product.name}".
- Do NOT add any product photo, packshot, or physical object.
- Do NOT add any person, model, or human figure.`
        : `PRODUCT: Look at the PRODUCT reference image. Show this EXACT product — same shape, same colors, same appearance.
- Display EXACTLY 1 unit of this product. NOT 2, NOT a stack, NOT multiple colors.
- The product MUST be FULLY VISIBLE — never cropped or cut off.
- NEVER create, invent, or add packaging (no box, bag, sachet, wrapper). Show the product as-is.
- NEVER write text, discount percentages, prices, or ANY text ON the product surface. The product must remain clean.
- NEVER show a person holding a miniature/card version of the product.
${layout.productSizePercent ? `- Product size: ${layout.productSizePercent}` : ""}`;

      visualPrompt = `${aspectRatio} — Create a professional advertising image for "${brandAnalysis.brandName}" selling "${product.name}".

${productSection}

LAYOUT (match these proportions precisely):
- Background: ${layout.backgroundStyle}
- Decorative elements: ${layout.decorativeElements}
- Text placement: ${layout.textPosition}
${layout.textAreaPercent ? `- Text area: ${layout.textAreaPercent}` : ""}
${!noProduct ? `- Product area: ${layout.productPosition}` : ""}
${layout.margins ? `- Margins: ${layout.margins}` : ""}
- CTA: ${layout.ctaStyle} at ${layout.ctaPosition}
- Brand name position: ${layout.brandLogoPosition}

TYPOGRAPHY (match this style precisely):
- Headline: ${layout.headlineStyle}${layout.subheadlineStyle ? `\n- Subheadline: ${layout.subheadlineStyle}` : ""}
- Primary text color: ${layout.textColor}${layout.accentColor ? `\n- Accent/highlight color: ${layout.accentColor}` : ""}
- General style: ${layout.typographyStyle}

TEXT ON IMAGE (in French — display ONLY this text, nothing more):
${imageText ? `"${imageText}"` : `"${brandAnalysis.brandName}"`}

SCENE: ${sceneDescription}

STRICT RULES:
${!noProduct ? `1. Show EXACTLY 1 unit of "${product.name}" from the PRODUCT reference. ONE. Not two, not multiple colors.` : `1. NO product photo, NO packshot, NO physical object on this image.`}
2. ${logoInstruction}
3. Brand colors: ${colors}.
4. The ONLY brand name is "${brandAnalysis.brandName}".
${discountStr && !discountAlreadyInText ? `5. DISCOUNT: Show "${discountStr}" prominently. Write it exactly as shown — no extra dashes. Show it ONLY ONCE.` : "5. No extra discount text needed — it's already in the text above (or there is none)."}
${showPrices ? `6. ${priceInfo}` : "6. NO PRICES on this image. Do NOT show any price, € symbol, or monetary amount anywhere."}
7. Display ONLY the text provided above. Do NOT add extra text, bullet points, feature lists, product descriptions, or any text not specified above. NEVER show any text element twice — each piece of text must appear exactly ONCE.
8. If the text above includes annotations with arrows/lines, each annotation MUST point to the correct part of the product.
${!noProduct ? "9. Photorealistic product, professional lighting, high-end advertising quality." : "9. Professional, high-end advertising quality."}
10. Match the template's proportions EXACTLY — text size ratios, spacing, element positions must be faithful to the described layout.
${noHuman ? "11. Do NOT add any person, model, hand, or human figure. The template has NO people — keep it that way." : ""}
12. ALL text on the image MUST be in FRENCH. Never use English words (except the brand name if it's in English).`.trim();
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
