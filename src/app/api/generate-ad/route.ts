import { NextResponse } from "next/server";
import { generateAdCopy, describeTemplateScene } from "@/lib/claude";
import type { TemplateAnalysis } from "@/lib/claude";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage, getTemplateByIdWithImage, trackUsedTemplate } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTemplateAnalysisFromDb, saveTemplateAnalysisToDb } from "@/lib/supabase/template-analysis";
import { analyzeTemplateMetadata } from "@/lib/claude";
import { compositeTextOverlay } from "@/lib/text-overlay";

/** Sanitize discount string: fix double dashes and double percent signs */
function cleanDiscount(raw: string): string {
  return raw
    .replace(/--+/g, "-")   // "--60%" → "-60%"
    .replace(/%%+/g, "%");  // "-60%%" → "-60%"
}

// Allow up to 120s for Claude + Gemini + overlay chain
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

    // ── Build scene description via Claude ──
    let sceneDescription: string;
    let isTextOnly = false;
    let templateAnalysis: TemplateAnalysis | null = null;

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

      console.log("[generate-ad] Scene:", sceneDescription);
      console.log("[generate-ad] Overlay text:", JSON.stringify(templateAnalysis.overlayText));
      console.log("[generate-ad] Text-only template:", isTextOnly);
      console.log("[generate-ad] Template type:", templateAnalysis.templateType);
    } else {
      sceneDescription = "Product displayed on a clean minimal surface with soft professional studio lighting.";
    }

    // ── Reference images (ORDER MATTERS: product first) ──
    const referenceImages: Array<{
      base64: string;
      mimeType: string;
      label: string;
    }> = [];

    const templateShowsProduct = templateAnalysis?.templateHasProductPhoto !== false;
    if (productImageBase64 && !isTextOnly && templateShowsProduct) {
      referenceImages.push({
        base64: productImageBase64,
        mimeType: productImageMimeType || "image/png",
        label: `PRODUCT for "${brandAnalysis.brandName}". Reproduce with PIXEL-PERFECT FIDELITY — exact shape, colors, textures, proportions. The product must be INDISTINGUISHABLE from this reference.
RULES:
- NEVER place ANY element ON the product surface (no text, no badges, no overlays)
- NEVER create or invent ANY object not in this photo (no box, jar, container, bag)
- Display as standalone item, FULLY VISIBLE, never cropped
- NEVER show a person holding the product`,
      });
    }

    if (brandLogoBase64) {
      referenceImages.push({
        base64: brandLogoBase64,
        mimeType: brandLogoMimeType || "image/png",
        label: `OFFICIAL LOGO for "${brandAnalysis.brandName}". Use EXACTLY as-is — ZERO modifications (no color change, no outline, no shadow).`,
      });
    }

    // Layout reference — ONLY for text-only templates
    if (template && isTextOnly) {
      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: `LAYOUT REFERENCE (different brand). Copy ONLY the visual structure: background, shapes, element positions. IGNORE all text and logos.`,
      });
    }

    if (isReference && referenceAdBase64) {
      referenceImages.push({
        base64: referenceAdBase64,
        mimeType: referenceAdMimeType || "image/png",
        label: `REFERENCE AD to copy. Reproduce the visual layout and style but for "${brandAnalysis.brandName}".`,
      });
    }

    if (isModification && previousAdBase64) {
      referenceImages.push({
        base64: previousAdBase64,
        mimeType: previousAdMimeType || "image/png",
        label: `PREVIOUS AD to modify: "${modificationPrompt}"`,
      });
    }

    // ── Logo instruction ──
    const logoInstruction = brandLogoBase64
      ? `Use the EXACT logo from the LOGO reference. ZERO modifications.`
      : `Write "${brandAnalysis.brandName}" in clean typography if showing brand name.`;

    // ── Discount string ──
    const discountStr = offer
      ? cleanDiscount(
          offer.discountValue && offer.discountType === "percentage"
            ? `-${String(offer.discountValue).replace(/%+$/, "")}%`
            : offer.discountValue
              ? `-${String(offer.discountValue).replace(/€+$/, "")}€`
              : (offer.title || "")
        ) || null
      : null;

    // ── Build Gemini prompt — HYBRID: NO text except brand name/logo ──
    let visualPrompt: string;
    const layout = templateAnalysis?.layout;
    const noHuman = !templateAnalysis?.templateHasHumanModel;

    if (isModification) {
      // Modification mode: keep as-is (text is already baked in)
      visualPrompt = `${aspectRatio} — Modify the PREVIOUS AD image: "${modificationPrompt}". Keep everything else identical.
Brand: "${brandAnalysis.brandName}", Product: "${product.name}". ${logoInstruction}`;
    } else if (isReference) {
      // Reference mode: copy layout but no text (overlay handles it)
      visualPrompt = `${aspectRatio} — Create an advertising image for "${brandAnalysis.brandName}" selling "${product.name}".
Copy the REFERENCE AD's visual layout, composition, and color scheme.
${productImageBase64 ? "Show the product from the PRODUCT reference." : ""}
Brand colors: ${colors}. ${logoInstruction}
CRITICAL: Do NOT render ANY text on the image except the brand name/logo. No headlines, no prices, no CTAs, no descriptions. Text will be added separately.`;
    } else if (template && layout && isTextOnly) {
      // Text-only: use layout reference, brand name only
      visualPrompt = `${aspectRatio} — Create a graphic background for "${brandAnalysis.brandName}".
Reproduce the EXACT layout from the LAYOUT REFERENCE:
- Background: ${layout.backgroundStyle}
- Decorative elements: ${layout.decorativeElements}
- Brand colors: ${colors}
${layout.margins ? `- Margins: ${layout.margins}` : ""}

Show ONLY the brand name "${brandAnalysis.brandName}" using ${logoInstruction}
NO other text. NO product photos. NO people. Text overlay (headlines, prices, CTA) will be added separately.

SCENE: ${sceneDescription}`;
    } else if (template && layout && templateAnalysis?.templateType === "comparison") {
      // Comparison template
      const productCategory = product.description || product.name;

      visualPrompt = `${aspectRatio} — Create a COMPARISON advertising image for "${brandAnalysis.brandName}".

SPLIT LAYOUT: ${layout.comparisonLayout || "left = bad, right = good"}

BAD SIDE: Generic, unappealing product from the SAME category as "${product.name}" (${productCategory}). Make it look dull/outdated.
GOOD SIDE: EXACTLY 1 unit of "${product.name}" from PRODUCT reference — pixel-perfect fidelity. FULLY VISIBLE. No invented objects.

- Background: ${layout.backgroundStyle}
- Brand colors: ${colors}
${layout.margins ? `- Margins: ${layout.margins}` : ""}
- ${logoInstruction}

CRITICAL: Do NOT render ANY text on the image except the brand name/logo. No headlines, no prices, no percentages, no CTAs. Text will be added as a separate overlay.
${noHuman ? "No people, no hands, no human figures." : ""}
NEVER place anything ON the product surface.

SCENE: ${sceneDescription}`;
    } else if (template && layout) {
      // Product showcase / lifestyle template
      const noProduct = !templateShowsProduct;

      visualPrompt = `${aspectRatio} — Create a professional advertising image for "${brandAnalysis.brandName}" selling "${product.name}".

${noProduct
  ? "This ad uses only graphics/shapes — NO product photo, NO people."
  : `PRODUCT: Reproduce from PRODUCT reference with PIXEL-PERFECT FIDELITY. 1 unit only. FULLY VISIBLE.
- NEVER create objects not in the reference (no box, jar, container)
- NEVER place anything ON the product surface
${layout.productSizePercent ? `- Product size: ${layout.productSizePercent}` : ""}
- Product position: ${layout.productPosition}`}

LAYOUT:
- Background: ${layout.backgroundStyle}
- Decorative elements: ${layout.decorativeElements}
${layout.margins ? `- Margins: ${layout.margins}` : ""}
- Brand colors: ${colors}
- ${logoInstruction}

CRITICAL: Do NOT render ANY text on the image except the brand name/logo. No headlines, no prices, no percentages, no CTAs, no feature lists. Text will be added as a separate overlay.
${noHuman ? "No people, no hands, no human figures." : ""}

SCENE: ${sceneDescription}`;
    } else {
      // Fallback: no template
      visualPrompt = `${aspectRatio} — Professional advertising photo for "${brandAnalysis.brandName}" selling "${product.name}".

Scene: ${sceneDescription}

${productImageBase64 ? `Show the product from PRODUCT reference — identical shape/colors. FULLY VISIBLE, never cropped. NEVER place elements on product.` : ""}
Brand colors: ${colors}. Photorealistic, high-end lighting.
${logoInstruction}

CRITICAL: Do NOT render ANY text on the image except the brand name/logo. No headlines, no prices, no CTAs. Text will be added separately.`;
    }

    // ── PARALLEL: Image + copy ──
    console.log(`[generate-ad] Calling Gemini (${referenceImages.length} refs) + Claude copy in PARALLEL...`);

    const overlayText = templateAnalysis?.overlayText;
    const copyAngle = customPrompt
      ? `Adapte le texte à cette direction créative : ${customPrompt}`
      : overlayText?.headline
        ? `Le headline est "${overlayText.headline}". Complète avec un body text et CTA cohérents.`
        : "Mets en avant le bénéfice le plus fort du produit avec les vrais arguments de la marque.";

    const [visualResult, copyRaw] = await Promise.all([
      generateImage(visualPrompt, aspectRatio, referenceImages),
      generateAdCopy(brandContext, format, copyAngle),
    ]);

    if (!visualResult) {
      console.error("[generate-ad] Gemini returned null — image generation failed");
      return NextResponse.json(
        { error: "Échec de la génération de l'image" },
        { status: 500 }
      );
    }
    console.log("[generate-ad] Gemini image + Claude copy done");

    // ── TEXT OVERLAY: composite text onto Gemini image ──
    // Skip overlay for modification mode (text already baked in)
    let finalImageBase64 = visualResult.imageBase64;
    let finalMimeType = visualResult.mimeType;

    if (!isModification) {
      const origPrice = offer?.originalPrice || product.originalPrice;
      const saleP = offer?.salePrice || product.salePrice;

      try {
        console.log("[generate-ad] Compositing text overlay...");
        const overlayResult = await compositeTextOverlay({
          baseImageBase64: visualResult.imageBase64,
          baseMimeType: visualResult.mimeType,
          headline: overlayText?.headline || product.name,
          brandName: brandAnalysis.brandName,
          discount: discountStr,
          originalPrice: origPrice || null,
          salePrice: saleP || null,
          ctaText: overlayText?.ctaText || "Découvrir",
          brandColors: brandAnalysis.colors || [],
          textColor: layout?.textColor,
          accentColor: layout?.accentColor,
          format,
          templateType: templateAnalysis?.templateType || "product-showcase",
        });
        finalImageBase64 = overlayResult.imageBase64;
        finalMimeType = overlayResult.mimeType;
        console.log("[generate-ad] Text overlay composited successfully");
      } catch (overlayErr) {
        console.error("[generate-ad] Text overlay failed, using raw Gemini image:", overlayErr);
        // Fallback: use Gemini image without overlay
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
      imageBase64: finalImageBase64,
      mimeType: finalMimeType,
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
