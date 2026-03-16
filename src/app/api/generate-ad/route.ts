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

    // ── Reference images — order: product, logo, template (Gemini sees images before prompt text) ──
    const templateShowsProduct = templateAnalysis?.templateHasProductPhoto !== false;
    if (productImageBase64 && !isTextOnly && templateShowsProduct) {
      referenceImages.push({
        base64: productImageBase64,
        mimeType: productImageMimeType || "image/png",
        label: `This is the exact product photo for "${brandAnalysis.brandName}" — "${product.name}". This product must appear in the final ad exactly as shown here: same colors, same shape, same textures, same proportions. Do not change anything about this product. If the product is black, it stays black. If it has lace trim, it keeps lace trim. Copy it with photographic fidelity as if you were placing this exact photo into the ad. Any product visible in the layout template below is from a different brand and must not appear in the final image.`,
      });
    }

    if (brandLogoBase64) {
      referenceImages.push({
        base64: brandLogoBase64,
        mimeType: brandLogoMimeType || "image/png",
        label: `This is the official logo for "${brandAnalysis.brandName}". Place it in the ad exactly as-is, without any modification. Do not add any background shape, banner, circle, or badge behind it. Do not change its colors, font, or proportions. Simply place it on the ad background.`,
      });
    }

    // Layout reference template
    const decorativeAction = templateAnalysis?.decorativeAction || "remove";
    if (template) {
      let decoContext: string;
      if (decorativeAction === "keep") {
        decoContext = "The decorative elements in this template are relevant to the brand, so keep them in the final ad.";
      } else if (decorativeAction === "remove") {
        decoContext = "The decorative elements in this template (leaves, flowers, objects, etc.) belong to a different brand and are not relevant. Remove them and use a clean background instead.";
      } else {
        decoContext = `The decorative elements in this template belong to a different brand. Replace them with: ${decorativeAction}.`;
      }

      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: `This is the layout template to reproduce. Create an ad that looks visually identical to this template in terms of background colors, gradients, composition, spacing, and overall mood. The product and all text in this template are from a completely different brand — replace the product with the product photo provided above, and replace all text with content about "${brandAnalysis.brandName}" selling "${product.name}". ${decoContext}`,
      });
    }

    if (isReference && referenceAdBase64) {
      referenceImages.push({
        base64: referenceAdBase64,
        mimeType: referenceAdMimeType || "image/png",
        label: `This is a reference ad to reproduce. Copy its exact visual layout, composition, colors, and style, but replace all products with the product photo above and all branding with "${brandAnalysis.brandName}".`,
      });
    }

    if (isModification && previousAdBase64) {
      referenceImages.push({
        base64: previousAdBase64,
        mimeType: previousAdMimeType || "image/png",
        label: `This is the previous version of the ad. Apply this modification: "${modificationPrompt}". Keep everything else identical.`,
      });
    }

    // ── Build Gemini prompt (narrative style per Google's best practices) ──
    let visualPrompt: string;
    const layout = templateAnalysis?.layout;

    const logoSentence = brandLogoBase64
      ? `Place the exact logo from the logo reference for "${brandAnalysis.brandName}" without any modification.`
      : `Write "${brandAnalysis.brandName}" in clean, modern typography as the brand name.`;

    if (isModification) {
      visualPrompt = `Modify the previous ad image by applying this change: "${modificationPrompt}". Keep everything else identical. The brand is "${brandAnalysis.brandName}" and the product is "${product.name}". ${logoSentence}`;

    } else if (isReference) {
      visualPrompt = `Create a professional Instagram advertising image for "${brandAnalysis.brandName}" selling "${product.name}". Reproduce the reference ad's exact visual layout, composition, and style. ${productImageBase64 ? `Feature the product from the product photo reference.` : ""} ${logoSentence} Adapt all text and branding for "${brandAnalysis.brandName}" with a short, punchy headline about "${product.name}". The result should look polished, modern, and Instagram-ready.`;

    } else if (template && layout) {
      const isComparison = templateAnalysis?.templateType === "comparison";
      const noHuman = !templateAnalysis?.templateHasHumanModel;

      // Build the narrative prompt as descriptive paragraphs
      let productNarrative: string;
      if (isTextOnly) {
        productNarrative = `This is a text-focused layout with no product photos. Create a clean, elegant background in the style of: ${layout.backgroundStyle}. No physical objects or people should appear.`;
      } else if (templateShowsProduct) {
        productNarrative = `Feature exactly one unit of "${product.name}" copied identically from the product photo reference — same exact color, shape, texture, and every detail. The product must be fully visible, never cropped, and shown as a standalone item without any packaging, boxes, or wrappers.${noHuman ? " Do not include any person, model, hand, or human figure in the image." : ""}`;
      } else {
        productNarrative = "";
      }

      let comparisonNarrative = "";
      if (isComparison) {
        comparisonNarrative = ` Use a ${layout.comparisonLayout || "left vs right split"} comparison layout. On the bad side, show a generic, unappealing version of an inferior alternative in "${product.name}"'s product category — make it look dull and outdated. On the good side, show "${product.name}" from the product photo reference, looking clean, premium, and desirable.`;
      }

      // Text instructions as natural language
      let textNarrative: string;
      if (overlayText) {
        textNarrative = `Write the headline "${overlayText.headline}" in ${layout.headlineStyle || "bold, prominent typography"} positioned at ${layout.textPosition || "the center of the image"}. Add a call-to-action button saying "${overlayText.ctaText}" styled as ${layout.ctaStyle || "a clean button"} at ${layout.ctaPosition || "the bottom"}. ${logoSentence}${brandContext.productPrice && templateAnalysis?.templateHasPrices ? ` Include the price "${brandContext.productPrice}".` : ""} Do not add any extra text, slogans, descriptions, or statistics beyond what is specified here. Use ${layout.typographyStyle || "clean sans-serif"} typography with ${layout.textColor || "white"} as the primary text color${layout.accentColor ? ` and ${layout.accentColor} as the accent color` : ""}.`;
      } else {
        textNarrative = `${logoSentence} Keep the text minimal — just the brand name.`;
      }

      visualPrompt = `Create a polished, high-end Instagram advertising image for "${brandAnalysis.brandName}" selling "${product.name}". Reproduce the layout template's exact visual style — same background colors and gradients, same composition and spacing, same overall mood and lighting. ${productNarrative}${comparisonNarrative} ${textNarrative} ${sceneDescription} The template is from a completely different brand, so every element of the final ad — product, text, logo, branding — must be 100% about "${brandAnalysis.brandName}". Zero elements from the template's original brand should remain. All text must be sharp, readable, and properly positioned with no overlapping or cut-off characters. The final result should be a professional, visually striking ad ready to post on Instagram.`;

    } else {
      // Fallback: no template
      visualPrompt = `Create a professional Instagram advertising image for "${brandAnalysis.brandName}" selling "${product.name}". ${sceneDescription} ${productImageBase64 ? `Feature the product exactly as shown in the product photo reference — same shape, colors, and details, fully visible and never cropped.` : ""} ${logoSentence} Write a short, punchy headline about "${product.name}" in modern, clean typography. The overall aesthetic should be premium, minimalist, and Instagram-ready.`;
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
