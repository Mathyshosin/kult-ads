import { NextResponse } from "next/server";
import { generateAdCopy, describeTemplateScene } from "@/lib/claude";
import type { TemplateAnalysis } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage, getTemplateByIdWithImage, trackUsedTemplate } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTemplateAnalysisFromDb, saveTemplateAnalysisToDb } from "@/lib/supabase/template-analysis";
import { analyzeTemplateMetadata } from "@/lib/claude";
import { compositeTextOverlay } from "@/lib/text-overlay";
import type { OverlayConfig, OverlayStyle } from "@/lib/text-overlay";

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

    // Track this template as recently used (for randomness)
    if (actualTemplateId) {
      trackUsedTemplate(user.id, actualTemplateId);
    }

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
        label: `THIS IS THE ONLY PRODUCT for "${brandAnalysis.brandName}". Reproduce with PIXEL-PERFECT FIDELITY.
- Exact shape, proportions, colors, textures, details. Must be INDISTINGUISHABLE from this reference.
- NEVER substitute with a generic version.
- NEVER add packaging, boxes, bags, or wrappers.
- NEVER show a person holding or touching the product.
- Show the product as a standalone item.
Any product in the layout reference is from a DIFFERENT brand and must NOT appear.`,
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
    if (template) {
      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: `LAYOUT REFERENCE — create the SAME visual style for "${brandAnalysis.brandName}".
Reproduce: background colors/gradients, composition, spacing, mood, decorative elements.
Replace: product (use PRODUCT reference), brand logo.
DO NOT include ANY text, headlines, prices, CTA buttons, or words in the image. Text will be added separately.`,
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

    // ── Discount / price data for overlay ──
    const discountStr = offer
      ? (() => {
          if (offer.discountValue && offer.discountType === "percentage") {
            return `-${String(offer.discountValue).replace(/%+$/, "")}%`;
          } else if (offer.discountValue) {
            return `-${String(offer.discountValue).replace(/€+$/, "")}€`;
          }
          return offer.title || null;
        })()
      : null;

    const origPrice = offer?.originalPrice || product.originalPrice;
    const salePrice = offer?.salePrice || product.salePrice;
    const templateHasPriceArea = templateAnalysis?.templateHasPrices ?? false;

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
      // Reference mode: copy the reference layout, no text
      visualPrompt = `${aspectRatio} — Create an advertising image for "${brandAnalysis.brandName}" selling "${product.name}".
Copy the REFERENCE AD's exact visual layout, composition, and style.
${productImageBase64 ? `Show the product from PRODUCT reference.` : ""}
${logoInstruction}

CRITICAL: Generate the image with ABSOLUTELY NO TEXT.
No headlines, no prices, no CTA buttons, no discount labels, no words.
Only the brand logo (as an image) may appear. Text will be added in post-production.`;
    } else if (template && layout) {
      // Template mode: simplified prompt, NO TEXT
      const competitors = brandAnalysis.competitorProducts?.length
        ? brandAnalysis.competitorProducts.slice(0, 2).join(" ou ")
        : "generic inferior alternative";

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
        productSection = `This is a TEXT-ONLY layout — NO product photos, NO physical objects, NO people.
Generate ONLY the background and decorative elements.
Background: ${layout.backgroundStyle}
Decorative elements: ${layout.decorativeElements || "same as layout reference, adapted to the brand"}`;
      } else if (templateShowsProduct) {
        productSection = `PRODUCT: Reproduce "${product.name}" from PRODUCT reference with PIXEL-PERFECT FIDELITY.
- EXACTLY 1 unit, fully visible, never cropped.
- NEVER add packaging, boxes, or wrappers.
${noHuman ? "- Do NOT add any person, model, hand, or human figure." : ""}`;
      }

      visualPrompt = `${aspectRatio} — Create an advertising image for "${brandAnalysis.brandName}" selling "${product.name}".

Copy the LAYOUT REFERENCE's visual style:
- Same background colors/gradients
- Same composition and spacing
- Same mood and lighting
- Same decorative elements (adapted to fit "${product.name}")
${comparisonSection}
${productSection}

${logoInstruction}

SCENE: ${sceneDescription}

CRITICAL: Generate the image with ABSOLUTELY NO TEXT.
No headlines, no prices, no CTA buttons, no discount labels, no words at all.
Only the brand logo (as an image element) may appear.
Text will be added separately in post-production.`;
    } else {
      // Fallback: no template
      visualPrompt = `${aspectRatio} — Professional advertising photo for "${brandAnalysis.brandName}" selling "${product.name}".

Scene: ${sceneDescription}

${productImageBase64 ? `Show ONLY "${product.name}" from the PRODUCT reference. Keep it IDENTICAL — same shape, colors, packaging. Fully visible, never cropped.` : ""}
${logoInstruction}

CRITICAL: Generate the image with ABSOLUTELY NO TEXT.
No headlines, no prices, no CTA buttons, no words.
Only the brand logo may appear. Text will be added separately.`;
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

    // ── Composite text overlay (Satori + Sharp) ──
    let finalImage = { imageBase64: visualResult.imageBase64, mimeType: visualResult.mimeType };

    // Only apply overlay if we have overlay text AND this is NOT a modification (which keeps existing text)
    if (overlayText && !isModification) {
      try {
        const overlayConfig: OverlayConfig = {
          headline: overlayText.headline,
          ctaText: overlayText.ctaText,
          discountBadge: templateHasPriceArea && discountStr ? discountStr : undefined,
          originalPrice: templateHasPriceArea && origPrice ? origPrice : undefined,
          salePrice: templateHasPriceArea && salePrice ? salePrice : undefined,
          price: templateHasPriceArea && !origPrice && !salePrice && product.price ? product.price : undefined,
        };

        const overlayStyle: OverlayStyle = {
          templateType: templateAnalysis?.templateType || "product-showcase",
          textPosition: layout?.textPosition || "bottom",
          ctaPosition: layout?.ctaPosition || "bottom-center",
          textColor: layout?.textColor || "#FFFFFF",
          accentColor: layout?.accentColor,
          brandPrimaryColor: brandAnalysis.colors?.[0] || "#6B46C1",
          dimensions: format === "square"
            ? { width: 1024, height: 1024 }
            : { width: 768, height: 1365 },
        };

        console.log("[generate-ad] Compositing text overlay...", { overlayConfig, templateType: overlayStyle.templateType });
        finalImage = await compositeTextOverlay(
          visualResult.imageBase64,
          visualResult.mimeType,
          overlayConfig,
          overlayStyle,
        );
        console.log("[generate-ad] Text overlay composited successfully");
      } catch (err) {
        console.error("[generate-ad] Text overlay failed, returning raw Gemini image:", err);
        // Fallback: return the raw Gemini image without overlay
      }
    }

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
