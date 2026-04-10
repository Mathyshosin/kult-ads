/**
 * build-ad-prompt.ts
 *
 * Pure, isomorphic functions that build the Gemini prompt and reference image
 * array for ad generation.  Extracted from `generate-ad/route.ts` so the same
 * logic can run in the browser (preview, cost estimate, etc.) without any
 * Node.js dependency.
 */

import { substitutePromptVariables } from "@/lib/prompt-variables";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrandContext {
  brandName: string;
  brandDescription?: string;
  tone?: string;
  targetAudience?: string;
  uniqueSellingPoints?: string[];
  competitorProducts?: string[];
  productName: string;
  productDescription?: string;
  productPrice?: string;
  productOriginalPrice?: string;
  productSalePrice?: string;
  offerTitle?: string;
  offerDescription?: string;
}

export interface BuildAdPromptParams {
  mode: "generation" | "modification" | "storyConversion";
  brandContext: BrandContext;
  format: "square" | "story";
  generationPrompt?: string | null;
  modificationPrompt?: string;
  customPrompt?: string;
  ctaText?: string;
  hasTemplate: boolean;
  isReference: boolean;
}

export interface BuildReferenceImagesParams {
  mode: "generation" | "modification" | "storyConversion";
  generationPrompt?: string | null;
  templateImageBase64?: string | null;
  templateMimeType?: string | null;
  productImageBase64?: string;
  productImageMimeType?: string;
  productName: string;
  referenceAdBase64?: string;
  referenceAdMimeType?: string;
  previousAdBase64?: string;
  previousAdMimeType?: string;
  modificationPrompt?: string;
  isReference: boolean;
  hasTemplate: boolean;
  isTextOnly: boolean;
  templateShowsProduct: boolean;
}

export interface ReferenceImage {
  base64: string;
  mimeType: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Helper — detectMimeType
// ---------------------------------------------------------------------------

/**
 * Detect actual MIME type from the first bytes of a base64 string.
 * Falls back to the provided default when no magic-byte match is found.
 */
export function detectMimeType(
  base64: string,
  fallback: string = "image/png",
): string {
  const header = base64.slice(0, 20);
  if (header.startsWith("/9j/") || header.startsWith("/9j+")) return "image/jpeg";
  if (header.startsWith("iVBOR")) return "image/png";
  if (header.startsWith("R0lGOD")) return "image/gif";
  if (header.startsWith("UklGR")) return "image/webp";
  return fallback;
}

// ---------------------------------------------------------------------------
// Shared instruction appended to ALL prompts to fix spelling errors
// ---------------------------------------------------------------------------

function buildSpellingRule(brandName?: string): string {
  let rule = `CRITICAL SPELLING AND BRAND NAME RULES:
- All text must be in perfect French with ZERO spelling mistakes.
- Never duplicate letters in words (e.g. "certiiifié" is wrong, "certifié" is correct).
- Never use "&" instead of "et" in general text.
- Double-check every single word before rendering it on the image.`;

  if (brandName) {
    rule += `
- BRAND NAME IS SACRED: The brand name is exactly "${brandName}" — copy it CHARACTER BY CHARACTER. Do not translate it, do not change "AND" to "et", do not change "CO" to "Co", do not add or remove spaces, do not modify capitalization. Write it EXACTLY as: "${brandName}".`;
  }

  return rule;
}

const PRICE_RULE = `
PRICE DISPLAY RULE: Do NOT display any price on the image unless the prompt above EXPLICITLY mentions a price, {{price}}, {{originalPrice}}, {{salePrice}}, or a specific amount in euros. If the prompt does not mention prices, do not add any — even if price data is available.`;

function appendSpellingRule(prompt: string, brandName?: string): string {
  return prompt + "\n\n" + buildSpellingRule(brandName) + "\n" + PRICE_RULE;
}

// ---------------------------------------------------------------------------
// buildAdPrompt
// ---------------------------------------------------------------------------

/**
 * Build the text prompt sent to Gemini for ad generation.
 *
 * Handles every generation mode:
 * - **storyConversion** — canvas extension from square to 9:16
 * - **modification** — structured edit on an existing ad
 * - **generationPrompt** (custom template prompt) — variable substitution +
 *   story adaptation + euro price rule
 * - **template / reference** (generic) — "decode marketing technique" prompt
 * - **basic** (no template, no reference) — simple product ad prompt
 */
export function buildAdPrompt(params: BuildAdPromptParams): string {
  const {
    mode,
    brandContext,
    format,
    generationPrompt,
    modificationPrompt,
    customPrompt,
    ctaText,
    hasTemplate,
    isReference,
  } = params;

  const isModification = mode === "modification" || mode === "storyConversion";
  const isStoryConversion = mode === "storyConversion";

  // Simple rules
  const ctaRule = ctaText ? `Add a CTA: "${ctaText}".` : "";
  const storyRule = format === "story"
    ? " STORY FORMAT: The canvas is taller (9:16). Do NOT add any new content, text, icons, or decorative elements. Keep EXACTLY the same elements as the square version — only extend the background and decorative areas vertically to fill the extra space. Leave top 15% and bottom 20% empty for story UI overlays."
    : "";

  // ── Story conversion ──
  if (isModification && isStoryConversion) {
    return appendSpellingRule(`STORY CANVAS CONVERSION — 9:16 vertical format.

YOUR ONLY TASK: Take the square ad and extend its canvas vertically.
- Extend the background colors and decorative elements above and below the content zone.
- Keep the content zone pixel-perfect identical: every text, every image, every icon, every color, every position, every size — unchanged.
- Leave top 15% and bottom 20% empty as safe zones for story UI.

ABSOLUTELY FORBIDDEN:
- Adding any new element (text, icon, badge, image, shape, overlay, pattern)
- Removing any existing element
- Moving or resizing any existing element
- Changing any text content or color`, brandContext.brandName);
  }

  // ── Modification ──
  if (isModification) {
    return appendSpellingRule(`You are editing an existing advertisement image.

MODIFICATION REQUESTED: "${modificationPrompt}"

STEP-BY-STEP INSTRUCTIONS:
1. Look at the existing ad image carefully.
2. Identify exactly what needs to change based on the modification request above.
3. Apply ONLY that specific change.
4. Keep absolutely everything else pixel-perfect identical: same layout, same colors, same text placement, same images, same composition, same background, same fonts, same positions.

CRITICAL RULES:
- The output must be visually identical to the original EXCEPT for the specific change requested.
- Do NOT add any new element that wasn't explicitly requested.
- Do NOT remove any element that wasn't explicitly mentioned.
- Do NOT change the style, mood, or overall aesthetic.
- Do NOT move or resize elements unless specifically asked.
- If asked to change text: change ONLY that text, keep all other text identical.
- If asked to change color: change ONLY that color, keep all other colors identical.
- All text in French.`, brandContext.brandName);
  }

  // ── Custom per-template prompt (generationPrompt) ──
  if (generationPrompt) {
    let visualPrompt = substitutePromptVariables(generationPrompt, {
      brandName: brandContext.brandName,
      brandDescription: brandContext.brandDescription,
      tone: brandContext.tone,
      targetAudience: brandContext.targetAudience,
      productName: brandContext.productName,
      productDescription: brandContext.productDescription,
      uniqueSellingPoints: brandContext.uniqueSellingPoints,
      competitorProducts: brandContext.competitorProducts,
      offerTitle: brandContext.offerTitle,
      offerDescription: brandContext.offerDescription,
      productPrice: brandContext.productPrice,
      productOriginalPrice: brandContext.productOriginalPrice,
      productSalePrice: brandContext.productSalePrice,
    });

    // For story format: adapt the prompt to vertical 9:16 instead of re-converting a square
    if (format === "story") {
      visualPrompt = visualPrompt
        .replace(/square format[^.]*/gi, "vertical story format (1080x1920), aspect ratio 9:16")
        .replace(/1080\s*x\s*1080/g, "1080x1920")
        .replace(/1:1/g, "9:16");
      visualPrompt += "\nIMPORTANT: This is a vertical 9:16 story format. Adapt the layout vertically — stack elements top to bottom with more spacing. Leave top 15% and bottom 20% empty for story UI overlays.";
    }

    if (ctaRule) visualPrompt += `\n${ctaRule}`;
    visualPrompt += `\nAll prices must be displayed in euros (€), not dollars.`;

    return appendSpellingRule(visualPrompt, brandContext.brandName);
  }

  // ── Generic template / reference mode ──
  if (isReference || hasTemplate) {
    // Build brand context lines (only non-empty fields)
    const brandLines = [
      `Brand: "${brandContext.brandName}"${brandContext.brandDescription ? ` — ${brandContext.brandDescription}` : ""}`,
      brandContext.tone ? `Tone: ${brandContext.tone}` : null,
      brandContext.uniqueSellingPoints?.length ? `Key selling points: ${brandContext.uniqueSellingPoints.slice(0, 3).join(" | ")}` : null,
      brandContext.offerTitle ? `Current offer: ${brandContext.offerTitle}${brandContext.offerDescription ? ` — ${brandContext.offerDescription}` : ""}` : null,
      brandContext.productOriginalPrice && brandContext.productSalePrice
        ? `Price: ${brandContext.productOriginalPrice} → ${brandContext.productSalePrice}`
        : brandContext.productPrice ? `Price: ${brandContext.productPrice}` : null,
    ].filter(Boolean).join("\n");

    return appendSpellingRule(`You are a senior media buyer and creative strategist.

STEP 1 — DECODE THE MARKETING TECHNIQUE: Look at the template and identify the single core psychological/marketing mechanism being used. Examples: "social proof via testimonials", "urgency with a deadline", "product-in-action demonstration", "before/after comparison", "price anchoring with discount", "bold claim + proof points". Ignore the specific product, industry, visuals, and copy — only extract the MECHANISM.

STEP 2 — REBUILD FROM SCRATCH: Apply that exact mechanism to "${brandContext.productName}" by "${brandContext.brandName}". Create a completely original ad using ONLY the brand context below. Do not reuse any visual treatment, color effect, or copy structure from the template.

LAYOUT: Match the same general spatial structure — number of zones, proportions, visual balance. Keep the same level of simplicity: if the template is minimal, stay minimal.

PRODUCT RULE: Use the product exactly as it appears in the product photo. The photo may show a model, mannequin, or accessories (jewelry, clothing, props) — extract ONLY "${brandContext.productName}". Never add liquid, food, props, effects, or any element not present in the product photo.

DATA RULE: Use ONLY data explicitly listed in the brand context below. Never invent promo codes, prices, percentages, reviews, or statistics. If the template uses a mechanism (e.g. promo code) that the brand doesn't have — replace it with what the brand actually offers instead. No logo.

BRAND CONTEXT:
${brandLines}
Product: "${brandContext.productName}"${brandContext.productDescription ? ` — ${brandContext.productDescription}` : ""}

All text in French.${ctaRule ? ` ${ctaRule}` : ""}${storyRule}`, brandContext.brandName);
  }

  // ── Basic mode (no template, no reference) ──
  return appendSpellingRule(`Create a professional Instagram ad for "${brandContext.brandName}" selling "${brandContext.productName}".
Use the reference image as creative direction — match its overall style, mood, and marketing approach.

ELEMENT COUNT RULE: Count every visible element in the reference (text blocks, images, icons). Your output must have EXACTLY the same number of elements — no more. If the reference is minimal, stay minimal.

PRODUCT EXTRACTION RULE: The product photo may include a model, mannequin, jewelry, clothing accessories, or other props. Extract and feature ONLY the core product itself — "${brandContext.productName}" — as it relates to the brand "${brandContext.brandName}". Never include surrounding elements. Copy the product exactly as photographed: no modifications, no text overlaid on it, no added decorations.

Write a short headline (2–5 words max).${ctaRule ? ` ${ctaRule}` : " Do NOT add any CTA."} No logo.

STRICT RULES:
- Use ONLY real information provided. Never invent prices, claims, percentages, or reviews.
- Brand name is "${brandContext.brandName}" — exact spelling.
- ALL text in French.${storyRule}`, brandContext.brandName);
}

// ---------------------------------------------------------------------------
// buildReferenceImages
// ---------------------------------------------------------------------------

/**
 * Assemble the ordered array of reference images sent alongside the prompt.
 *
 * The order matters — Gemini treats earlier images as more authoritative.
 *
 * Modes:
 * - **modification / storyConversion** — only the previous ad
 * - **generationPrompt** — template as technique reference + product photo
 * - **generic template** — template as creative direction + product photo
 * - **reference** — reference ad as creative direction + product photo
 * - **basic** — product photo only
 */
export function buildReferenceImages(params: BuildReferenceImagesParams): ReferenceImage[] {
  const {
    mode,
    generationPrompt,
    templateImageBase64,
    templateMimeType,
    productImageBase64,
    productImageMimeType,
    productName,
    referenceAdBase64,
    referenceAdMimeType,
    previousAdBase64,
    previousAdMimeType,
    modificationPrompt,
    isReference,
    hasTemplate,
    isTextOnly,
    templateShowsProduct,
  } = params;

  const images: ReferenceImage[] = [];

  const isModification = mode === "modification" || mode === "storyConversion";
  const isStoryConversion = mode === "storyConversion";

  // ── MODIFICATION MODE: send ONLY the previous ad ──
  if (isModification && previousAdBase64) {
    const imageLabel = isStoryConversion
      ? `This is the square ad to convert to 9:16 story format. Your ONLY task: extend the background and decorative areas upward and downward. The content area must be pixel-perfect identical to this image. Do not add, remove, move, or resize any element.`
      : `This is the existing ad to edit. Apply ONLY this modification: "${modificationPrompt}". Keep absolutely everything else identical — same layout, colors, text placement, images, composition. The output must be visually identical except for the requested change.`;
    images.push({
      base64: previousAdBase64,
      mimeType: detectMimeType(previousAdBase64, previousAdMimeType || "image/jpeg"),
      label: imageLabel,
    });

    return images;
  }

  // ── CUSTOM PROMPT MODE (generationPrompt): technique reference + product ──
  if (generationPrompt && templateImageBase64) {
    images.push({
      base64: templateImageBase64,
      mimeType: detectMimeType(templateImageBase64, templateMimeType || "image/png"),
      label: `MARKETING TECHNIQUE REFERENCE ONLY. This image shows the type of marketing approach to reproduce (comparison, social proof, discount highlight, product showcase, etc.). Do NOT copy any visual element from this image — no colors, no layout, no text style, no decorative elements, no products, no fonts. Create a completely original ad following ONLY the written prompt below.`,
    });

    if (productImageBase64) {
      images.push({
        base64: productImageBase64,
        mimeType: detectMimeType(productImageBase64, productImageMimeType || "image/jpeg"),
        label: `Product photo for "${productName}" — use this exact product in the ad. Copy it identically: same colors, shape, textures, proportions. Do not modify the product.`,
      });
    }

    return images;
  }

  // ── GENERIC TEMPLATE MODE: template as creative direction + product ──
  if (hasTemplate && templateImageBase64) {
    images.push({
      base64: templateImageBase64,
      mimeType: detectMimeType(templateImageBase64, templateMimeType || "image/png"),
      label: `Creative direction reference — use this ad's style, color palette, mood, and marketing approach as inspiration. Do NOT copy its products, logo, text, or decorative elements. Only draw inspiration from its overall visual direction.`,
    });

    if (productImageBase64 && !isTextOnly && templateShowsProduct) {
      images.push({
        base64: productImageBase64,
        mimeType: detectMimeType(productImageBase64, productImageMimeType || "image/jpeg"),
        label: `Product photo for "${productName}" — feature this exact product in the ad. Copy it identically: same colors, shape, textures, proportions. Do not modify the product.`,
      });
    }

    return images;
  }

  // ── REFERENCE MODE: reference ad as creative direction + product ──
  if (isReference && referenceAdBase64) {
    images.push({
      base64: referenceAdBase64,
      mimeType: detectMimeType(referenceAdBase64, referenceAdMimeType || "image/jpeg"),
      label: `Creative direction reference — use this ad's style, color palette, mood, and marketing approach as inspiration. Do NOT copy its products, logo, text, or decorative elements. Only draw inspiration from its overall visual direction.`,
    });

    if (productImageBase64) {
      images.push({
        base64: productImageBase64,
        mimeType: detectMimeType(productImageBase64, productImageMimeType || "image/jpeg"),
        label: `Product photo for "${productName}" — feature this exact product in the ad. Copy it identically: same colors, shape, textures, proportions. Do not modify the product.`,
      });
    }

    return images;
  }

  // ── BASIC MODE: product photo only ──
  if (productImageBase64) {
    images.push({
      base64: productImageBase64,
      mimeType: detectMimeType(productImageBase64, productImageMimeType || "image/jpeg"),
      label: `Product photo for "${productName}". Feature this product exactly as shown — same colors, shape, textures.`,
    });
  }

  return images;
}
