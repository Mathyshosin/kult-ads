import { NextResponse } from "next/server";
import { generateAdCopy, describeTemplateScene } from "@/lib/claude";
import type { TemplateAnalysis } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage, getTemplateByIdWithImage, trackUsedTemplate } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTemplateAnalysisFromDb, saveTemplateAnalysisToDb } from "@/lib/supabase/template-analysis";
import { analyzeTemplateMetadata } from "@/lib/claude";

/** Sanitize discount string: fix double dashes and double percent signs */
function cleanDiscount(raw: string): string {
  return raw
    .replace(/--+/g, "-")   // "--60%" → "-60%"
    .replace(/%%+/g, "%");  // "-60%%" → "-60%"
}

/**
 * Light sanitizer for imageText — catches common Haiku mistakes:
 * - Invented statistics ("300 000 utilisatrices", "4.8/5")
 * - Feature lists with separators ("|")
 * - Excessive word count
 */
function sanitizeImageText(text: string, maxLines: number): string {
  let lines = text.split("\n");

  lines = lines.map((line) => {
    // Strip invented statistics: large numbers + people words
    line = line.replace(
      /\+?\d[\d\s.,]*\d*\s*(utilisat(eur|rice)s?|clients?|femmes|hommes|personnes|avis|étoiles|stars?|reviews?|customers?|users?|satisfait(e)?s?)/gi,
      ""
    ).trim();

    // Strip star ratings
    line = line.replace(/[★⭐]{2,}/g, "");
    line = line.replace(/\d[.,]\d\s*\/\s*5/g, "");

    // Strip pipe-separated feature lists → keep only first item
    if (line.includes("|")) {
      line = line.split("|")[0].trim();
    }

    // Strip bullet markers
    line = line.replace(/^[\s]*[•●◆▸▹→➤✓✔-]\s*/g, "");

    // Cap each line at 6 words
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length > 6) {
      line = words.slice(0, 6).join(" ");
    }

    return line.trim();
  });

  // Remove empty lines
  lines = lines.filter((l) => l.length > 0);

  // Cap total lines
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
  }

  // Cap total words at 20
  let totalWords = 0;
  lines = lines.map((line) => {
    const words = line.split(/\s+/);
    const remaining = 20 - totalWords;
    if (remaining <= 0) return "";
    if (words.length > remaining) {
      totalWords += remaining;
      return words.slice(0, remaining).join(" ");
    }
    totalWords += words.length;
    return line;
  }).filter((l) => l.length > 0);

  return lines.join("\n");
}

// Allow up to 120s for Claude + Gemini chain
export const maxDuration = 120;

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
      referenceAdBase64,
      referenceAdMimeType,
      modificationPrompt,
      previousAdBase64,
      previousAdMimeType,
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

    // ── Mode detection ──
    const isModification = !!(modificationPrompt && previousAdBase64);
    const isReference = !!(referenceAdBase64 && !isModification);
    console.log(`[generate-ad] Starting generation. templateId=${templateId}, format=${format}, customPrompt=${!!customPrompt}, isReference=${isReference}, isModification=${isModification}`);

    // ── Get template image (library mode only, skip if reference/modification mode) ──
    const template = (isReference || isModification) ? null : (
      templateId
        ? await getTemplateByIdWithImage(templateId)
        : customPrompt
          ? null
          : await getRandomTemplateWithImage(format, user.id)
    );
    console.log(`[generate-ad] Template loaded: ${template ? template.id : "none"}`);

    // Track the actual template ID used (important for random templates)
    const actualTemplateId = template?.id || templateId || null;

    // Track this template as recently used (for randomness)
    if (actualTemplateId) {
      trackUsedTemplate(user.id, actualTemplateId);
    }

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

      // ── Safety filter: sanitize imageText (strip invented stats, cap word count) ──
      if (imageText) {
        const maxLines = Math.min(templateAnalysis.templateTextCount, 5);
        const before = imageText;
        imageText = sanitizeImageText(imageText, maxLines);
        if (before !== imageText) {
          console.log("[generate-ad] imageText sanitized:", { before, after: imageText });
        }
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
        label: `THIS IS THE ONLY PRODUCT FOR "${brandAnalysis.brandName}". You MUST reproduce this product with PIXEL-PERFECT FIDELITY.

CRITICAL FIDELITY RULES — THE PRODUCT MUST BE AN EXACT COPY:
- Reproduce the EXACT shape, proportions, colors, textures, and details from this photo. The product in the ad must be INDISTINGUISHABLE from this reference.
- If the product is black, it stays black. If it has a pattern, reproduce that EXACT pattern. If it has a specific texture (ribbed, lace, matte, glossy), reproduce it faithfully.
- Do NOT generalize or simplify the product. A "culotte côtelée" (ribbed) must show visible ribbed texture. A "culotte en dentelle" (lace) must show actual lace patterns.
- NEVER substitute with a generic version — the viewer must recognize THIS SPECIFIC product.
- NEVER write text, percentages, prices, or ANY overlay ON the product surface.
- NEVER create, invent, or add packaging (no box, bag, wrapper). Show the product as-is.
- NEVER show a person holding a miniature version or a card with the product.
- The product should be displayed as a standalone item.
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

    // Layout reference template — sent for ALL template types so Gemini has a visual reference
    if (template) {
      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: `LAYOUT REFERENCE — THIS IS FROM A DIFFERENT BRAND (NOT "${brandAnalysis.brandName}").
Your job: create the SAME style of ad but for "${brandAnalysis.brandName}" selling "${product.name}".

COPY from this reference:
- The overall layout structure (where text goes, where product goes, spacing, proportions)
- The background style (colors, gradients, patterns)
- The typography style (font weight, size ratios, text arrangement)
- The visual mood and energy (minimal, bold, fun, elegant)
- The decorative element STYLE (but replace specific objects with ones relevant to "${product.name}")

DO NOT COPY from this reference:
- Any text/words (replace ALL text with "${brandAnalysis.brandName}" content)
- Any products/objects (replace with "${product.name}" from the PRODUCT reference)
- Any brand names/logos (use "${brandAnalysis.brandName}" instead)
- Any specific offers, prices, or promotions (use only the real offer data provided in the prompt)`,
      });
    }

    // Reference ad — user uploaded an ad to copy/adapt
    if (isReference && referenceAdBase64) {
      referenceImages.push({
        base64: referenceAdBase64,
        mimeType: referenceAdMimeType || "image/png",
        label: `REFERENCE AD to copy. Reproduce the EXACT same visual layout, composition, color scheme, and style — but adapt ALL text and branding for "${brandAnalysis.brandName}" selling "${product.name}". Replace ALL text, logos, and brand elements. Keep the visual structure identical.`,
      });
    }

    // Modification mode — previous ad as base + modification instructions
    if (isModification && previousAdBase64) {
      referenceImages.push({
        base64: previousAdBase64,
        mimeType: previousAdMimeType || "image/png",
        label: `PREVIOUS AD to modify. This is the base image. Apply the following modification while keeping everything else identical: "${modificationPrompt}"`,
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
            ? `-${String(offer.discountValue).replace(/%+$/, "")}%`
            : offer.discountValue
              ? `-${String(offer.discountValue).replace(/€+$/, "")}€`
              : (offer.title || "")
        ) || null
      : null;

    // Only show prices/discount if Claude detected a price area on the template AND we have real data
    const templateHasPriceArea = templateAnalysis?.templateHasPrices ?? true; // default true for non-template mode
    const showPrices = templateHasPriceArea && priceInfo;
    const showDiscount = templateHasPriceArea && discountStr;

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
- Decorative elements: Use decorative elements that match the STYLE of "${layout.decorativeElements}" but are RELEVANT to "${brandAnalysis.brandName}" and "${product.name}". Replace any brand-specific objects (products, bottles, props from another industry) with abstract or brand-relevant alternatives.
- Text placement: ${layout.textPosition}
- Typography: ${layout.typographyStyle}
- Headline style: ${layout.headlineStyle}${layout.subheadlineStyle ? `\n- Subheadline style: ${layout.subheadlineStyle}` : ""}
- Text color: ${layout.textColor}${layout.accentColor ? ` | Accent color: ${layout.accentColor}` : ""}
- CTA: ${layout.ctaStyle} at ${layout.ctaPosition}
- Brand name position: ${layout.brandLogoPosition}
${layout.textAreaPercent ? `- Text area: ${layout.textAreaPercent}` : ""}
${layout.margins ? `- Margins: ${layout.margins}` : ""}

TEXT ON IMAGE (in the brand's language — display ONLY this text, nothing more):
${imageText ? `"${imageText}"` : `"${brandAnalysis.brandName}"`}

This is a TEXT-ONLY ad — NO product photos, NO physical objects, NO people.

SCENE: ${sceneDescription}

STRICT RULES:
1. The ONLY brand name is "${brandAnalysis.brandName}".
2. ${logoInstruction}
3. Brand colors: ${colors}.
${showDiscount && !discountAlreadyInText ? `4. DISCOUNT: Show "${discountStr}" prominently. No extra dashes. Show it ONLY ONCE.` : "4. No extra discount text needed — it's already in the text above (or there is none)."}
5. Display ONLY the text provided above. Do NOT add extra text, bullet points, feature lists, star ratings, review counts, statistics, or any text not specified above. NEVER show any text element twice.
6. Match the EXACT proportions and spacing from the layout reference — text sizes, margins, element positions must be faithful to the original template.
7. ALL text MUST match the brand's language. If the brand communicates in French, write in French. If in English, write in English.
8. CRITICAL: Layout position values (like "8-20%", "25%", "45-55%") are INSTRUCTIONS for placement — they are NOT text to display on the image. NEVER render position percentages as visible text.
9. NEVER invent statistics, star ratings, review counts, or customer numbers. Show ONLY the text provided above.`;
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
- Reproduce the product with PIXEL-PERFECT FIDELITY from the PRODUCT reference photo — same shape, same colors, same textures, same patterns, same proportions. The product must be INDISTINGUISHABLE from the reference.
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

TEXT ON IMAGE (in the brand's language — display ONLY this text):
${imageText ? `"${imageText}"` : `"${brandAnalysis.brandName}"`}

SCENE: ${sceneDescription}

STRICT RULES:
1. Clear visual comparison — two distinct sides.
2. BAD side: Must show a product from the SAME CATEGORY as "${product.name}". NOT a random object from the template.
3. GOOD side: EXACTLY 1 unit of "${product.name}" from PRODUCT reference. Never cropped. Show ONLY the product itself — NO hands, NO arms, NO person holding or touching it. NO invented objects. ONLY what is visible in the PRODUCT reference photo.
4. ${logoInstruction}
5. Brand colors: ${colors}.
${showDiscount && !discountAlreadyInText ? `6. DISCOUNT: Show "${discountStr}" prominently. No extra dashes. Show it ONLY ONCE.` : "6. No extra discount text needed."}
${showPrices ? `7. ${priceInfo}` : "7. NO PRICES anywhere on the image."}
8. NEVER add labels or text ON the product.
9. Display ONLY the text provided above. No extra text, no bullet points, no feature lists, no star ratings, no review counts, no statistics. NEVER show any text element twice.
10. ALL text MUST match the brand's language. If the brand communicates in French, write in French. If in English, write in English.
11. CRITICAL: Layout position values (like "8-20%", "25%", "45-55%") are INSTRUCTIONS for placement — they are NOT text to display. NEVER render position percentages as visible text.
12. NEVER invent statistics, star ratings, review counts, or customer numbers.`;
    } else if (template && layout && !isTextOnly) {
      // ── Product template: layout reference image IS sent to Gemini for visual quality
      //    Product photo + layout reference + detailed layout description ──

      const noHuman = !templateAnalysis?.templateHasHumanModel;
      const noProduct = !templateShowsProduct;

      const productSection = noProduct
        ? `This ad does NOT show a product photo — it uses only text, shapes, and graphics to advertise "${product.name}".
- Do NOT add any product photo, packshot, or physical object.
- Do NOT add any person, model, or human figure.`
        : `PRODUCT: Look at the PRODUCT reference image. Reproduce this product with PIXEL-PERFECT FIDELITY — same shape, same colors, same textures, same patterns, same proportions. The product must be INDISTINGUISHABLE from the reference.
- Display EXACTLY 1 unit of this product. NOT 2, NOT a stack, NOT multiple colors.
- The product MUST be FULLY VISIBLE — never cropped or cut off.
- Reproduce EXACT textures and details: if ribbed texture → show ribbed, if lace → show lace, if glossy → show glossy. NEVER substitute with a generic version.
- NEVER create, invent, or add packaging (no box, bag, sachet, wrapper). Show the product as-is.
- NEVER write text, discount percentages, prices, or ANY text ON the product surface. The product must remain clean.
- NEVER show a person holding a miniature/card version of the product.
${layout.productSizePercent ? `- Product size: ${layout.productSizePercent}` : ""}`;

      visualPrompt = `${aspectRatio} — Create a professional advertising image for "${brandAnalysis.brandName}" selling "${product.name}".

Look at the LAYOUT REFERENCE image — reproduce the SAME visual style and layout but adapted for "${brandAnalysis.brandName}":
- Same background style, same text positioning, same overall composition
- Replace the template's product with "${product.name}" from the PRODUCT reference
- Replace ALL text with "${brandAnalysis.brandName}" content (provided below)
- Replace any decorative objects with elements relevant to "${product.name}"

${productSection}

LAYOUT (from the reference — match these proportions):
- Background: ${layout.backgroundStyle}
- Decorative elements: Match the STYLE of decorative elements from the LAYOUT REFERENCE but use objects relevant to "${product.name}" (e.g. cotton flowers, leaves, fabric textures). NEVER keep objects from the template's original brand.
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

TEXT ON IMAGE (in the brand's language — display ONLY this text, nothing more):
${imageText ? `"${imageText}"` : `"${brandAnalysis.brandName}"`}

SCENE: ${sceneDescription}

STRICT RULES:
${!noProduct ? `1. Show EXACTLY 1 unit of "${product.name}" from the PRODUCT reference. ONE. Not two, not multiple colors.` : `1. NO product photo, NO packshot, NO physical object on this image.`}
2. ${logoInstruction}
3. Brand colors: ${colors}.
4. The ONLY brand name is "${brandAnalysis.brandName}".
${showDiscount && !discountAlreadyInText ? `5. DISCOUNT: Show "${discountStr}" prominently. Write it exactly as shown — no extra dashes. Show it ONLY ONCE.` : "5. No extra discount text needed — it's already in the text above (or there is none)."}
${showPrices ? `6. ${priceInfo}` : "6. NO PRICES on this image. Do NOT show any price, € symbol, or monetary amount anywhere."}
7. Display ONLY the text provided above. Do NOT add extra text, bullet points, feature lists, star ratings, review counts, statistics, product descriptions, or any text not specified above. NEVER show any text element twice.
8. If the text above includes annotations with arrows/lines, each annotation MUST point to the correct part of the product.
${!noProduct ? "9. Photorealistic product, professional lighting, high-end advertising quality." : "9. Professional, high-end advertising quality."}
10. Match the template's proportions EXACTLY — text size ratios, spacing, element positions must be faithful to the described layout.
${noHuman ? "11. Do NOT add any person, model, hand, or human figure. The template has NO people — keep it that way." : ""}
12. ALL text MUST match the brand's language. If the brand communicates in French, write in French. If in English, write in English.
13. CRITICAL: Layout position values (like "8-20%", "25%", "45-55%") are INSTRUCTIONS for placement — they are NOT text to display on the image. NEVER render position percentages as visible text.
14. NEVER invent statistics, star ratings, review counts, or customer numbers. Show ONLY the text provided above.
15. COHERENCE: The ONLY physical product in this image is "${product.name}". ALL decorative elements must be relevant to this product and "${brandAnalysis.brandName}". NEVER include objects from another brand or industry (no perfume bottles, no food items, no electronics, no unrelated products). Use simple, relevant decorative elements instead.`.trim();
    } else if (isTextOnly) {
      // Fallback text-only (no template ref)
      const textContent = imageText
        ? `The main headline text on the image MUST be: "${imageText}". Spell the brand name "${brandAnalysis.brandName}" EXACTLY like this.`
        : `Create compelling text in the brand's language for "${brandAnalysis.brandName}" using their key selling points.`;

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

    // ── Reference ad mode: override prompt to copy the reference layout ──
    if (isReference) {
      visualPrompt = `${aspectRatio} — Create a professional advertising image for "${brandAnalysis.brandName}" selling "${product.name}".

Look at the REFERENCE AD image and reproduce the EXACT same visual layout, composition, color scheme, typography style, and element positions — but replace ALL text, branding, and products with "${brandAnalysis.brandName}" content.

${productImageBase64 ? `Show the product from the PRODUCT reference — same shape, colors, appearance.` : ""}
Brand colors: ${colors}.
${logoInstruction}

STRICT RULES:
1. Copy the reference ad's LAYOUT and VISUAL STYLE precisely.
2. Replace ALL text with content about "${product.name}" by "${brandAnalysis.brandName}" in the brand's language.
3. Replace ALL logos and brand elements with "${brandAnalysis.brandName}".
4. Do NOT copy any text from the reference — only copy the visual structure.
5. NEVER invent statistics, star ratings, or customer numbers.
6. Professional advertising quality.
${customPrompt ? `\nADDITIONAL INSTRUCTIONS: ${customPrompt}` : ""}`;
    }

    // ── Modification mode: tweak the previous ad ──
    if (isModification) {
      visualPrompt = `${aspectRatio} — Modify the PREVIOUS AD image according to these instructions:

MODIFICATION REQUESTED: "${modificationPrompt}"

Keep everything else from the previous ad IDENTICAL — same layout, same product, same colors, same text positioning. Only apply the specific modification requested above.

Brand: "${brandAnalysis.brandName}"
Product: "${product.name}"
${logoInstruction}

STRICT RULES:
1. Start from the PREVIOUS AD and make ONLY the requested modification.
2. Keep ALL other elements unchanged.
3. Professional advertising quality.`;
    }

    // ── PARALLEL: Image + copy at the same time (saves 2-5s) ──
    console.log(`[generate-ad] Calling Gemini (${referenceImages.length} refs) + Claude copy in PARALLEL...`);

    const copyAngle = customPrompt
      ? `Adapte le texte à cette direction créative : ${customPrompt}`
      : imageText
        ? `Le texte "${imageText}" est déjà sur l'image. Complète avec un body text et CTA cohérents qui renforcent ce message.`
        : "Mets en avant le bénéfice le plus fort du produit avec les vrais arguments de la marque.";

    const [visualResult, copyRaw] = await Promise.all([
      generateImage(visualPrompt, aspectRatio, referenceImages),
      generateAdCopy(brandContext, format, copyAngle),
    ]);

    if (!visualResult) {
      console.error("[generate-ad] Gemini returned null — image generation failed after all retries");
      return NextResponse.json(
        { error: "Échec de la génération de l'image" },
        { status: 500 }
      );
    }
    console.log("[generate-ad] Gemini image + Claude copy done");

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
