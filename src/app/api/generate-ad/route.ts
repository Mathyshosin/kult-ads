import { NextResponse } from "next/server";
// generateAdCopy removed — Gemini handles all text on the image directly
import type { TemplateAnalysisData } from "@/lib/template-store";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage, getTemplateByIdWithImage } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTemplateAnalysisFromDb, saveTemplateAnalysisToDb } from "@/lib/supabase/template-analysis";
import { analyzeTemplateMetadata } from "@/lib/claude";

// Allow up to 120s for Claude + Gemini + Satori chain
export const maxDuration = 120;

/** Detect actual MIME type from base64 magic bytes */
function detectMimeType(base64: string, fallback: string = "image/png"): string {
  const header = base64.slice(0, 20);
  if (header.startsWith("/9j/") || header.startsWith("/9j+")) return "image/jpeg";
  if (header.startsWith("iVBOR")) return "image/png";
  if (header.startsWith("R0lGOD")) return "image/gif";
  if (header.startsWith("UklGR")) return "image/webp";
  return fallback;
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();

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
      ctaText: rawCtaText,
      skipCreditCheck,
    } = body;

    // Credit check (skip for gift generations)
    if (!skipCreditCheck) {
      const { getOrCreateSubscription } = await import("@/lib/supabase/subscriptions");
      const subscription = await getOrCreateSubscription(user.id, user.email || undefined);
      if (subscription.credits_remaining <= 0) {
        return NextResponse.json(
          { error: "Plus de crédits disponibles. Passez à un plan supérieur pour continuer.", code: "NO_CREDITS" },
          { status: 402 }
        );
      }
    }

    const ctaText = rawCtaText?.trim() || null;

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
        // Skip live analysis — too slow (7s+), would cause timeout on Vercel
        // Use minimal defaults instead. Template will be analyzed later via admin.
        console.log(`[generate-ad] No cached metadata for ${template.id}, using defaults (skip Sonnet to save time)`);
        precomputedAnalysis = {
          templateType: "product-showcase",
          isTextOnly: false,
          layout: {
            backgroundStyle: "clean professional background",
            textPlacement: "top",
            productPlacement: "center",
            logoPlacement: "top-left",
            accentColor: "",
            textColor: "",
          },
          tags: { industry: "", adType: "", productType: "" },
        } as unknown as TemplateAnalysisData;
        // Fire-and-forget: cache analysis for next time (won't block this request)
        analyzeTemplateMetadata(template.imageBase64, template.mimeType)
          .then((analysis) => saveTemplateAnalysisToDb(template.id, analysis))
          .catch(() => {});
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
        mimeType: detectMimeType(previousAdBase64, previousAdMimeType || "image/jpeg"),
        label: `This is the existing ad to edit. Apply ONLY this modification: "${modificationPrompt}". Keep absolutely everything else identical — same layout, colors, text placement, images, composition. The output must be visually identical except for the requested change.`,
      });
    } else if (template) {
      // TEMPLATE MODE: template as creative direction reference
      referenceImages.push({
        base64: template.imageBase64,
        mimeType: detectMimeType(template.imageBase64, template.mimeType),
        label: `Creative direction reference — use this ad's style, color palette, mood, and marketing approach as inspiration. Do NOT copy its products, logo, text, or decorative elements. Only draw inspiration from its overall visual direction.`,
      });

      if (productImageBase64 && !isTextOnly && templateShowsProduct) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: detectMimeType(productImageBase64, productImageMimeType || "image/jpeg"),
          label: `Product photo for "${product.name}" — feature this exact product in the ad. Copy it identically: same colors, shape, textures, proportions. Do not modify the product.`,
        });
      }

    } else if (isReference && referenceAdBase64) {
      // REFERENCE MODE: treat uploaded ad same as template — creative direction first
      referenceImages.push({
        base64: referenceAdBase64,
        mimeType: detectMimeType(referenceAdBase64, referenceAdMimeType || "image/jpeg"),
        label: `Creative direction reference — use this ad's style, color palette, mood, and marketing approach as inspiration. Do NOT copy its products, logo, text, or decorative elements. Only draw inspiration from its overall visual direction.`,
      });

      if (productImageBase64) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: detectMimeType(productImageBase64, productImageMimeType || "image/jpeg"),
          label: `Product photo for "${product.name}" — feature this exact product in the ad. Copy it identically: same colors, shape, textures, proportions. Do not modify the product.`,
        });
      }

    } else {
      // NO TEMPLATE / NO REFERENCE: product first, then logo
      if (productImageBase64) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: detectMimeType(productImageBase64, productImageMimeType || "image/jpeg"),
          label: `Product photo for "${product.name}". Feature this product exactly as shown — same colors, shape, textures.`,
        });
      }

    }

    // (modification image already added at the top of referenceImages)

    // ── Build Gemini prompt ──
    let visualPrompt: string;
    const layout = metadata?.layout;

    // Core rules for all modes
    const ctaRule = ctaText ? `Add a CTA button: "${ctaText}".` : "Do NOT add any CTA button or call-to-action.";
    const productRule = productImageBase64 ? "Copy the product photo EXACTLY as-is — same shape, colors, packaging. Never redesign it." : "";
    const brandRule = `Write "${brandAnalysis.brandName}" in clean typography where the template has a brand name.`;
    const storyRule = format === "story" ? " Story format (9:16): leave top 15% and bottom 20% empty." : "";
    const langRule = "ALL text MUST be in French.";

    if (isModification) {
      visualPrompt = `Edit this ad: "${modificationPrompt}". Keep EVERYTHING else identical — same layout, colors, text, composition. Only apply the requested change. ${langRule}`;

    } else if (isReference) {
      visualPrompt = `Recreate this ad for "${brandAnalysis.brandName}" selling "${product.name}". Keep the EXACT same layout, composition, number of text elements, and visual structure as the reference. Replace: the brand → "${brandAnalysis.brandName}", the product → use the provided product photo. ${productRule} ${brandRule} ${ctaRule} Keep text minimal — only replace existing text, don't add more. Never invent fake prices or claims.${storyRule} ${langRule}`;

    } else if (template) {
      visualPrompt = `Recreate this ad template for "${brandAnalysis.brandName}" selling "${product.name}". CRITICAL: Keep the EXACT same layout — same number of text blocks, same text positions, same composition, same visual balance. Simply SWAP: the brand name → "${brandAnalysis.brandName}", the product → use the provided product photo, the headline → something about "${product.name}" (2-5 words max). ${productRule} ${brandRule} ${ctaRule} Do NOT add extra text, prices, or elements that aren't in the template. Do NOT add decorative elements. Keep it clean and faithful to the template's structure.${storyRule} ${langRule}`;

    } else {
      visualPrompt = `Create a clean, professional Instagram ad for "${brandAnalysis.brandName}" selling "${product.name}". ${productRule} ${brandRule} Short headline (2-5 words). ${ctaRule} Minimal, modern design.${storyRule} ${langRule}`;
    }

    // ── IMAGE ONLY: skip Haiku copy to maximize time for Gemini ──
    console.log(`[generate-ad] Calling Gemini (${referenceImages.length} refs)...`);

    const visualResult = await generateImage(visualPrompt, aspectRatio, referenceImages, 1);

    if (!visualResult) {
      console.error("[generate-ad] Gemini returned null — image generation failed after all retries");
      return NextResponse.json(
        { error: "Échec de la génération de l'image" },
        { status: 500 }
      );
    }
    console.log("[generate-ad] Gemini image done");

    const finalImage = { imageBase64: visualResult.imageBase64, mimeType: visualResult.mimeType };

    // Simple copy metadata (no Haiku call — saves time, Gemini handles text on image)
    const copy = {
      headline: brandContext.offerTitle || brandContext.uniqueSellingPoints?.[0] || product.name,
      bodyText: brandContext.productDescription?.slice(0, 80) || "",
      callToAction: ctaText || "",
    };

    // Save reference ad as pending template for admin moderation (must await on Vercel)
    if (isReference && referenceAdBase64) {
      try {
        const { uploadPendingImage, savePendingTemplate } = await import("@/lib/supabase/pending-templates");
        const pendingId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const mime = detectMimeType(referenceAdBase64, referenceAdMimeType || "image/jpeg");
        const ext = mime.includes("png") ? "png" : "jpg";
        await uploadPendingImage(`${pendingId}.${ext}`, referenceAdBase64, mime);
        await savePendingTemplate(pendingId, `${pendingId}.${ext}`, mime, format, user.id);
        console.log(`[generate-ad] Saved pending template ${pendingId}`);
      } catch (err) {
        console.error("[generate-ad] Pending template save failed:", err);
      }
    }

    // Deduct credit after successful generation (skip for gifts)
    if (!skipCreditCheck) {
      const { deductCredit } = await import("@/lib/supabase/subscriptions");
      await deductCredit(user.id);
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
