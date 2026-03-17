import { NextResponse } from "next/server";
import { generateAdCopy } from "@/lib/claude";
import type { TemplateAnalysisData } from "@/lib/template-store";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage, getTemplateByIdWithImage } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTemplateAnalysisFromDb, saveTemplateAnalysisToDb } from "@/lib/supabase/template-analysis";
import { analyzeTemplateMetadata } from "@/lib/claude";

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
      previousAdBase64: rawPreviousAdBase64,
      previousAdMimeType: rawPreviousAdMimeType,
      previousAdId,
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

    // ── Fetch previous ad from Supabase if needed ──
    let previousAdBase64 = rawPreviousAdBase64;
    let previousAdMimeType = rawPreviousAdMimeType;
    if (modificationPrompt && previousAdId && !previousAdBase64) {
      const { data: adRow } = await supabase
        .from("generated_ads")
        .select("image_path")
        .eq("id", previousAdId)
        .eq("user_id", user.id)
        .single();
      if (adRow?.image_path) {
        const { data: fileData } = await supabase.storage
          .from("generated-ads")
          .download(adRow.image_path);
        if (fileData) {
          const buffer = await fileData.arrayBuffer();
          previousAdBase64 = Buffer.from(buffer).toString("base64");
          previousAdMimeType = adRow.image_path.endsWith(".png") ? "image/png" : "image/jpeg";
        }
      }
    }

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

    // ── Build scene description using precomputed metadata (no Haiku call) ──
    let sceneDescription: string;
    let isTextOnly = false;
    let metadata: TemplateAnalysisData | null = null;

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

      // Use precomputed metadata directly — no Haiku call
      metadata = precomputedAnalysis;
      isTextOnly = metadata.isTextOnly;
      // Only include background color/gradient — strip any mention of decorative elements
      const bgStyle = metadata.layout.backgroundStyle || "clean minimal background";
      sceneDescription = `Background: ${bgStyle}. Typography: ${metadata.layout.typographyStyle}. Clean background with no decorative objects.`;

      console.log("[generate-ad] Template type:", metadata.templateType);
      console.log("[generate-ad] Text-only:", isTextOnly);
      console.log("[generate-ad] Layout:", JSON.stringify(metadata.layout));
    } else {
      sceneDescription = "Product displayed on a clean minimal surface with soft professional studio lighting.";
    }

    // ── Reference images ──
    // For template mode: template FIRST (it's the base to edit), then product/logo as swap references
    // For other modes: product first, then other refs
    const referenceImages: Array<{
      base64: string;
      mimeType: string;
      label: string;
    }> = [];

    const templateShowsProduct = metadata?.templateHasProductPhoto !== false;

    // MODIFICATION MODE: send ONLY the previous ad — no other images
    if (isModification && previousAdBase64) {
      referenceImages.push({
        base64: previousAdBase64,
        mimeType: previousAdMimeType || "image/png",
        label: `This is the existing ad to edit. Apply ONLY this modification: "${modificationPrompt}". Keep absolutely everything else identical — same layout, colors, text placement, images, composition. The output must be visually identical except for the requested change.`,
      });
    } else if (template) {
      // TEMPLATE MODE: template as creative direction reference
      // Template first so Gemini sees the style before anything else
      referenceImages.push({
        base64: template.imageBase64,
        mimeType: template.mimeType,
        label: `Creative direction reference — use this ad's style, color palette, mood, and marketing approach as inspiration. Do NOT copy its products, logo, text, or decorative elements. Only draw inspiration from its overall visual direction.`,
      });

      if (productImageBase64 && !isTextOnly && templateShowsProduct) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: productImageMimeType || "image/png",
          label: `Product photo for "${product.name}" — feature this exact product in the ad. Copy it identically: same colors, shape, textures, proportions. Do not modify the product.`,
        });
      }

      if (brandLogoBase64) {
        referenceImages.push({
          base64: brandLogoBase64,
          mimeType: brandLogoMimeType || "image/png",
          label: `Logo for "${brandAnalysis.brandName}" — place this exact logo in the ad as-is, no modification, no background shape added.`,
        });
      }
    } else {
      // NON-TEMPLATE MODES: product first, then logo, then refs
      if (productImageBase64) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: productImageMimeType || "image/png",
          label: `Product photo for "${product.name}". Feature this product exactly as shown — same colors, shape, textures.`,
        });
      }

      if (brandLogoBase64) {
        referenceImages.push({
          base64: brandLogoBase64,
          mimeType: brandLogoMimeType || "image/png",
          label: `Official logo for "${brandAnalysis.brandName}". Place as-is without modification.`,
        });
      }
    }

    if (isReference && referenceAdBase64) {
      referenceImages.push({
        base64: referenceAdBase64,
        mimeType: referenceAdMimeType || "image/png",
        label: `Reference ad to reproduce. Copy its exact layout, composition, and colors, but swap products and branding for "${brandAnalysis.brandName}".`,
      });
    }

    // (modification image already added at the top of referenceImages)

    // ── Build Gemini prompt ──
    let visualPrompt: string;
    const layout = metadata?.layout;

    // Headline: use offer title, first USP, or product name
    const headlineHint = brandContext.offerTitle
      || brandContext.uniqueSellingPoints?.[0]
      || product.name;

    // Price text for templates that show prices
    let priceText = "";
    if (brandContext.productOriginalPrice && brandContext.productSalePrice) {
      priceText = ` Replace any price with: original price "${brandContext.productOriginalPrice}" crossed out, sale price "${brandContext.productSalePrice}" highlighted.`;
    } else if (brandContext.productPrice) {
      priceText = ` Replace any price with "${brandContext.productPrice}".`;
    }

    if (isModification) {
      visualPrompt = `You are an image editor. The provided image is an existing advertisement. Your job is to make ONE specific edit to it: "${modificationPrompt}". CRITICAL: Keep everything else EXACTLY the same — same background, same layout, same product placement, same text style, same colors, same composition. The result must look like the same ad with only the requested modification applied. Do NOT redesign, recreate, or reimagine the ad.`;

    } else if (isReference) {
      visualPrompt = `Edit the reference ad image. Keep the exact same layout, background, colors, and composition. Make these swaps: ${productImageBase64 ? "Replace the product with the product photo provided." : ""} ${brandLogoBase64 ? `Replace the logo with the logo provided for "${brandAnalysis.brandName}".` : `Write "${brandAnalysis.brandName}" as the brand name.`} Replace all text with content about "${brandAnalysis.brandName}" selling "${product.name}" — write a short punchy headline. The result must look like the same ad but for a different brand.`;

    } else if (template && layout) {
      // TEMPLATE INSPIRATION MODE — use template as creative direction reference
      const productInstruction = templateShowsProduct && productImageBase64 && !isTextOnly
        ? `Feature the product from the product photo — copy it exactly as-is (same colors, shape, texture), fully visible, never cropped.${!metadata?.templateHasHumanModel ? " Do not add any person or human figure." : ""}`
        : isTextOnly
          ? "This is a text-focused ad style — no product photo needed."
          : "";

      const logoInstruction = brandLogoBase64
        ? `Use the provided logo for "${brandAnalysis.brandName}" exactly as-is, no modification.`
        : `Write "${brandAnalysis.brandName}" in clean, modern typography.`;

      const textInstruction = metadata?.textElements && metadata.textElements.length > 0
        ? `Write a short, punchy headline about "${headlineHint}" (2-5 words max). Add a CTA button saying "Découvrir".${priceText} Use ${layout.typographyStyle || "clean sans-serif"} typography with ${layout.textColor || "white"} text${layout.accentColor ? ` and ${layout.accentColor} accents` : ""}.`
        : `${logoInstruction}`;

      const comparisonNote = metadata?.templateType === "comparison"
        ? ` Use a comparison layout: one side shows a generic inferior alternative, the other side shows "${product.name}" looking premium and desirable.`
        : "";

      visualPrompt = `Create a professional Instagram ad for "${brandAnalysis.brandName}" selling "${product.name}" (${brandContext.productDescription || ""}). Use the template image as creative direction — match its overall style, color palette (${layout.backgroundStyle || "clean background"}), mood, and marketing approach (${metadata?.templateType || "product-showcase"}). ${productInstruction} ${logoInstruction} ${textInstruction}${comparisonNote} Do NOT copy decorative elements from the template (flowers, leaves, cotton, props) — keep the background clean. Do NOT invent product features or claims. Only use real information about "${product.name}". All text must be sharp and readable. The result should be a polished, modern ad inspired by the template's style.`;

    } else {
      // Fallback: no template — create from scratch
      visualPrompt = `Create a professional Instagram ad for "${brandAnalysis.brandName}" selling "${product.name}" (${brandContext.productDescription || ""}). ${productImageBase64 ? "Feature the product exactly as shown in the product photo — same shape, colors, details, fully visible." : ""} ${brandLogoBase64 ? `Place the logo provided for "${brandAnalysis.brandName}" as-is.` : `Write "${brandAnalysis.brandName}" in clean typography.`} Write a short headline about "${headlineHint}". Premium, minimalist, Instagram-ready.`;
    }

    // ── PARALLEL: Image + copy at the same time ──
    console.log(`[generate-ad] Calling Gemini (${referenceImages.length} refs) + Claude copy in PARALLEL...`);

    const copyAngle = customPrompt
      ? `Adapte le texte à cette direction créative : ${customPrompt}`
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
        sceneDescription,
        templateType: metadata?.templateType || null,
        referenceImageLabels: referenceImages.map((r) => r.label.slice(0, 100)),
        templateImageBase64: template?.imageBase64 || null,
        templateMimeType: template?.mimeType || null,
      },
    });
  } catch (error) {
    console.error("[generate-ad] ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
