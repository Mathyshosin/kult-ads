import { NextResponse } from "next/server";
import { generateAdCopy, describeTemplateScene } from "@/lib/claude";
import type { TemplateAnalysis } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage, getTemplateByIdWithImage } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTemplateAnalysisFromDb, saveTemplateAnalysisToDb } from "@/lib/supabase/template-analysis";
import { analyzeTemplateMetadata } from "@/lib/claude";
// Text overlay imports kept for potential future use
// import { compositeTextOverlay } from "@/lib/text-overlay";
// import type { OverlayConfig, OverlayStyle } from "@/lib/text-overlay";

// Allow up to 120s for Claude + Gemini + Satori chain
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

    // Template tracking now handled via Supabase (generated_ads.template_id)
    // No need for in-memory tracking — getRandomTemplateWithImage queries recent ads

    // ── Build scene description ──
    let sceneDescription: string;
    let isTextOnly = false;
    let templateAnalysis: TemplateAnalysis | null = null;
    let overlayText: { headline: string; ctaText: string } | null = null;

    if (customPrompt) {
      sceneDescription = customPrompt;
    } else if (template) {
      // Fetch pre-computed analysis from Supabase (or analyze + cache on first use)
      let precomputedAnalysis = await getTemplateAnalysisFromDb(template.id);

      if (!precomputedAnalysis) {
        console.log(`[generate-ad] No cached metadata for ${template.id}, analyzing and caching...`);
        precomputedAnalysis = await analyzeTemplateMetadata(template.imageBase64, template.mimeType);
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
      isTextOnly = templateAnalysis.isTextOnly;
      overlayText = templateAnalysis.overlayText || null;

      console.log("[generate-ad] Scene:", sceneDescription);
      console.log("[generate-ad] Overlay text:", JSON.stringify(overlayText));
      console.log("[generate-ad] Decorative action:", templateAnalysis.decorativeAction);
      console.log("[generate-ad] Text-only template:", isTextOnly);
      console.log("[generate-ad] Template type:", templateAnalysis.templateType);
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
    const templateShowsProduct = templateAnalysis?.templateHasProductPhoto !== false;
    if (productImageBase64 && !isTextOnly && templateShowsProduct) {
      referenceImages.push({
        base64: productImageBase64,
        mimeType: productImageMimeType || "image/png",
        label: `THIS IS THE EXACT PRODUCT for "${brandAnalysis.brandName}". COPY IT IDENTICALLY — DO NOT MODIFY IT IN ANY WAY.
- SAME exact shape, proportions, colors, textures, fabric, stitching, every detail.
- SAME exact color — if the product is BLACK, it must be BLACK. NEVER change the color.
- Must be INDISTINGUISHABLE from this photo. Treat it as a sacred reference — zero creative liberty.
- NEVER substitute with a generic version, a different model, or a different color variant.
- NEVER add packaging, boxes, bags, or wrappers.
- NEVER show a person holding or touching the product.
- NEVER modify, enhance, simplify, or "improve" the product appearance.
- Show the product as a standalone item.
Any product in the layout reference is from a DIFFERENT brand and must NOT appear — ONLY this product.`,
      });
    }

    // Brand logo
    if (brandLogoBase64) {
      referenceImages.push({
        base64: brandLogoBase64,
        mimeType: brandLogoMimeType || "image/png",
        label: `OFFICIAL LOGO for "${brandAnalysis.brandName}". ZERO modifications.
- NEVER add a background shape behind it (no banner, rectangle, circle, badge)
- NEVER change colors, font, or style. NEVER add outlines/shadows/effects.
- Place as-is on the ad background.`,
      });
    }

    // Layout reference template
    const decorativeAction = templateAnalysis?.decorativeAction || "remove";
    if (template) {
      let decoInstruction: string;
      if (decorativeAction === "keep") {
        decoInstruction = "Keep the same decorative elements visible in this template.";
      } else if (decorativeAction === "remove") {
        decoInstruction = "REMOVE all decorative objects from this template. Use a CLEAN background instead.";
      } else {
        // "replace with [X]"
        decoInstruction = `REPLACE the template's decorative objects with: ${decorativeAction}.`;
      }

      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: `LAYOUT REFERENCE — reproduce this template's EXACT style for "${brandAnalysis.brandName}".
Copy EXACTLY: background colors/gradients, composition, spacing, mood, overall aesthetic.
Replace: product (use PRODUCT reference instead), brand name/logo (use "${brandAnalysis.brandName}").
${decoInstruction}
The text on this template is from a DIFFERENT brand — adapt ALL text for "${brandAnalysis.brandName}" and "${product.name}".`,
      });
    }

    // Reference ad mode
    if (isReference && referenceAdBase64) {
      referenceImages.push({
        base64: referenceAdBase64,
        mimeType: referenceAdMimeType || "image/png",
        label: `REFERENCE AD to copy. Reproduce EXACT visual layout and style for "${brandAnalysis.brandName}". Replace ALL products and branding. DO NOT include any text — text will be added separately.`,
      });
    }

    // Modification mode
    if (isModification && previousAdBase64) {
      referenceImages.push({
        base64: previousAdBase64,
        mimeType: previousAdMimeType || "image/png",
        label: `PREVIOUS AD to modify. Apply: "${modificationPrompt}". Keep everything else identical.`,
      });
    }

    // ── Logo instruction (for Gemini prompt) ──
    const logoInstruction = brandLogoBase64
      ? `Use the EXACT logo from the LOGO reference for "${brandAnalysis.brandName}". ZERO modifications.`
      : `If showing a brand name, write "${brandAnalysis.brandName}" in clean typography.`;

    // ── Build simplified Gemini prompt (NO TEXT) ──
    let visualPrompt: string;
    const layout = templateAnalysis?.layout;

    if (isModification) {
      // Modification mode: keep current behavior (Gemini handles everything)
      visualPrompt = `${aspectRatio} — Modify the PREVIOUS AD image:
MODIFICATION: "${modificationPrompt}"
Keep everything else IDENTICAL. Brand: "${brandAnalysis.brandName}", Product: "${product.name}".
${logoInstruction}`;
    } else if (isReference) {
      // Reference mode: copy the reference layout
      visualPrompt = `${aspectRatio} — Create a professional Instagram ad for "${brandAnalysis.brandName}" selling "${product.name}".
Copy the REFERENCE AD's exact visual layout, composition, and style.
${productImageBase64 ? `Show the product from PRODUCT reference.` : ""}
${logoInstruction}
Adapt ALL text and branding for "${brandAnalysis.brandName}" — write the brand name and a short headline about "${product.name}".
The result must look polished, modern, and Instagram-ready.`;
    } else if (template && layout) {
      // Template mode: Gemini reproduces template style with brand content
      const isComparison = templateAnalysis?.templateType === "comparison";
      const noHuman = !templateAnalysis?.templateHasHumanModel;

      let comparisonSection = "";
      if (isComparison) {
        comparisonSection = `
COMPARISON LAYOUT: ${layout.comparisonLayout || "left = bad alternative, right = good product"}
BAD SIDE: Generic, unappealing version of an inferior alternative in "${product.name}"'s category. Make it look dull/outdated.
GOOD SIDE: "${product.name}" from PRODUCT reference — clean, premium, desirable. PIXEL-PERFECT reproduction.`;
      }

      let productSection = "";
      if (isTextOnly) {
        productSection = `This is a TEXT-FOCUSED layout — NO product photos, NO physical objects, NO people.
Background style: ${layout.backgroundStyle}
Keep the background clean and elegant.`;
      } else if (templateShowsProduct) {
        productSection = `PRODUCT: Copy "${product.name}" IDENTICALLY from PRODUCT reference — ZERO modifications.
- EXACTLY 1 unit, fully visible, never cropped.
- EXACT same color, shape, texture, fabric — if the product is BLACK, it stays BLACK.
- NEVER change the product's appearance, color, or style in any way.
- NEVER add packaging, boxes, or wrappers.
${noHuman ? "- Do NOT add any person, model, hand, or human figure." : ""}`;
      }

      // Build text instructions for Gemini
      const imageTextContent = overlayText
        ? `TEXT TO WRITE ON THE IMAGE:
- Headline: "${overlayText.headline}" — ${layout.headlineStyle || "bold, large, prominent"}
- CTA button: "${overlayText.ctaText}" — ${layout.ctaStyle || "clean button style"}
- Brand name: "${brandAnalysis.brandName}" — at ${layout.brandLogoPosition || "top or bottom"}
${brandContext.productPrice ? `- Price: "${brandContext.productPrice}" (ONLY if the template shows prices)` : ""}
Write text EXACTLY as specified above. Do NOT add extra text, slogans, or descriptions.
Text placement: headline at ${layout.textPosition || "center"}, CTA at ${layout.ctaPosition || "bottom"}.
Typography: ${layout.typographyStyle || "clean sans-serif"}. Text color: ${layout.textColor || "white"}.`
        : `TEXT: Write "${brandAnalysis.brandName}" as brand name. Keep text minimal.`;

      visualPrompt = `${aspectRatio} — Create a professional Instagram ad for "${brandAnalysis.brandName}" selling "${product.name}".

STYLE: Reproduce the LAYOUT REFERENCE template EXACTLY — same background, same composition, same spacing, same visual mood.
The result must look like a polished, high-end Instagram ad. Modern, clean, premium.
${comparisonSection}
${productSection}

${logoInstruction}

${imageTextContent}

SCENE: ${sceneDescription}

CRITICAL RULES:
- The template is from a DIFFERENT brand. ALL content must be adapted for "${brandAnalysis.brandName}".
- Product, brand name, text = 100% "${brandAnalysis.brandName}". ZERO elements from the template's original brand.
- Text must be sharp, readable, and well-positioned. No overlapping, no cut-off text.
- Final result must be Instagram-ready: polished, professional, visually striking.`;
    } else {
      // Fallback: no template
      visualPrompt = `${aspectRatio} — Create a professional Instagram ad for "${brandAnalysis.brandName}" selling "${product.name}".

Scene: ${sceneDescription}

${productImageBase64 ? `Show ONLY "${product.name}" from the PRODUCT reference. Keep it IDENTICAL — same shape, colors, packaging. Fully visible, never cropped.` : ""}
${logoInstruction}

Write "${brandAnalysis.brandName}" as brand name and a short headline about "${product.name}".
Modern, clean, premium aesthetic. Instagram-ready.`;
    }

    // ── PARALLEL: Image + copy at the same time ──
    console.log(`[generate-ad] Calling Gemini (${referenceImages.length} refs) + Claude copy in PARALLEL...`);

    const copyAngle = customPrompt
      ? `Adapte le texte à cette direction créative : ${customPrompt}`
      : overlayText
        ? `Le headline "${overlayText.headline}" est sur l'image. Complète avec un body text et CTA cohérents.`
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

    // Gemini now handles all text directly — no Satori overlay needed
    const finalImage = { imageBase64: visualResult.imageBase64, mimeType: visualResult.mimeType };

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
            bodyText: product.description?.slice(0, 60) || "",
            callToAction: "Découvrir",
          };
    }

    return NextResponse.json({
      id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      format,
      imageBase64: finalImage.imageBase64,
      mimeType: finalImage.mimeType,
      headline: copy.headline,
      bodyText: copy.bodyText,
      callToAction: copy.callToAction,
      productId: product.id,
      offerId: offer?.id,
      templateId: actualTemplateId,
      timestamp: Date.now(),
      // Debug info for prompt inspection
      _debug: {
        geminiPrompt: visualPrompt,
        imageText: null,
        overlayText,
        sceneDescription,
        templateType: templateAnalysis?.templateType || null,
        referenceImageLabels: referenceImages.map((r) => r.label.slice(0, 100)),
      },
    });
  } catch (error) {
    console.error("[generate-ad] ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
