import { NextResponse } from "next/server";
// generateAdCopy removed — Gemini handles all text on the image directly
import type { TemplateAnalysisData } from "@/lib/template-store";
import { generateImage } from "@/lib/gemini";
import { getRandomTemplateWithImage, getTemplateByIdWithImage } from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTemplateAnalysisFromDb, saveTemplateAnalysisToDb } from "@/lib/supabase/template-analysis";
import { analyzeTemplateMetadata } from "@/lib/claude";

// Vercel Hobby hard limit = 60s. Gemini timeout set to 50s in gemini.ts (10s headroom).
export const maxDuration = 60;

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
      isStoryConversion,
      ctaText: rawCtaText,
      skipCreditCheck,
    } = body;

    // Credit check + immediate deduction (prevents race condition with concurrent generations)
    // Credit is refunded below if Gemini fails.
    let creditCost = 0;
    if (!skipCreditCheck) {
      const { deductCredit } = await import("@/lib/supabase/subscriptions");
      const result = await deductCredit(user.id);
      if (!result.success) {
        return NextResponse.json(
          { error: "Plus de crédits disponibles. Passez à un plan supérieur pour continuer.", code: "NO_CREDITS" },
          { status: 402 }
        );
      }
      creditCost = result.cost;
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
          .catch((err) => console.error(`[generate-ad] Failed to cache template analysis for ${template.id}:`, err));
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
      const imageLabel = isStoryConversion
        ? `This is the square ad to convert to 9:16 story format. Your ONLY task: extend the background and decorative areas upward and downward. The content area must be pixel-perfect identical to this image. Do not add, remove, move, or resize any element.`
        : `This is the existing ad to edit. Apply ONLY this modification: "${modificationPrompt}". Keep absolutely everything else identical — same layout, colors, text placement, images, composition. The output must be visually identical except for the requested change.`;
      referenceImages.push({
        base64: previousAdBase64,
        mimeType: detectMimeType(previousAdBase64, previousAdMimeType || "image/jpeg"),
        label: imageLabel,
      });
    } else if (template?.generationPrompt) {
      // CUSTOM PROMPT MODE: no template image, only product photo + prompt
      if (productImageBase64) {
        referenceImages.push({
          base64: productImageBase64,
          mimeType: detectMimeType(productImageBase64, productImageMimeType || "image/jpeg"),
          label: `Product photo for "${product.name}" — use this exact product in the ad. Copy it identically: same colors, shape, textures, proportions. Do not modify the product.`,
        });
      }

    } else if (template) {
      // GENERIC TEMPLATE MODE: template image as reference + product photo
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

    // Simple rules
    const ctaRule = ctaText ? `Add a CTA: "${ctaText}".` : "";
    const storyRule = format === "story"
      ? " STORY FORMAT: The canvas is taller (9:16). Do NOT add any new content, text, icons, or decorative elements. Keep EXACTLY the same elements as the square version — only extend the background and decorative areas vertically to fill the extra space. Leave top 15% and bottom 20% empty for story UI overlays."
      : "";

    if (isModification && isStoryConversion) {
      visualPrompt = `STORY CANVAS CONVERSION — 9:16 vertical format.

YOUR ONLY TASK: Take the square ad and extend its canvas vertically.
- Extend the background colors and decorative elements above and below the content zone.
- Keep the content zone pixel-perfect identical: every text, every image, every icon, every color, every position, every size — unchanged.
- Leave top 15% and bottom 20% empty as safe zones for story UI.

ABSOLUTELY FORBIDDEN:
- Adding any new element (text, icon, badge, image, shape, overlay, pattern)
- Removing any existing element
- Moving or resizing any existing element
- Changing any text content or color`;

    } else if (isModification) {
      visualPrompt = `Edit this ad: "${modificationPrompt}". Change ONLY what is requested. Keep everything else identical. Text in French.`;

    } else if (template?.generationPrompt) {
      // ── Custom per-template prompt with variable substitution ──
      const { substitutePromptVariables } = await import("@/lib/prompt-variables");
      visualPrompt = substitutePromptVariables(template.generationPrompt, {
        brandName: brandContext.brandName,
        brandDescription: brandContext.brandDescription,
        tone: brandContext.tone,
        targetAudience: brandContext.targetAudience,
        productName: product.name,
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

    } else if (isReference || template) {
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

      visualPrompt = `You are a senior media buyer and creative strategist.

STEP 1 — DECODE THE MARKETING TECHNIQUE: Look at the template and identify the single core psychological/marketing mechanism being used. Examples: "social proof via testimonials", "urgency with a deadline", "product-in-action demonstration", "before/after comparison", "price anchoring with discount", "bold claim + proof points". Ignore the specific product, industry, visuals, and copy — only extract the MECHANISM.

STEP 2 — REBUILD FROM SCRATCH: Apply that exact mechanism to "${product.name}" by "${brandContext.brandName}". Create a completely original ad using ONLY the brand context below. Do not reuse any visual treatment, color effect, or copy structure from the template.

LAYOUT: Match the same general spatial structure — number of zones, proportions, visual balance. Keep the same level of simplicity: if the template is minimal, stay minimal.

PRODUCT RULE: Use the product exactly as it appears in the product photo. The photo may show a model, mannequin, or accessories (jewelry, clothing, props) — extract ONLY "${product.name}". Never add liquid, food, props, effects, or any element not present in the product photo.

DATA RULE: Use ONLY data explicitly listed in the brand context below. Never invent promo codes, prices, percentages, reviews, or statistics. If the template uses a mechanism (e.g. promo code) that the brand doesn't have — replace it with what the brand actually offers instead. No logo.

BRAND CONTEXT:
${brandLines}
Product: "${product.name}"${brandContext.productDescription ? ` — ${brandContext.productDescription}` : ""}

All text in French.${ctaRule ? ` ${ctaRule}` : ""}${storyRule}`;

    } else {
      visualPrompt = `Create a professional Instagram ad for "${brandAnalysis.brandName}" selling "${product.name}".
Use the reference image as creative direction — match its overall style, mood, and marketing approach.

ELEMENT COUNT RULE: Count every visible element in the reference (text blocks, images, icons). Your output must have EXACTLY the same number of elements — no more. If the reference is minimal, stay minimal.

PRODUCT EXTRACTION RULE: The product photo may include a model, mannequin, jewelry, clothing accessories, or other props. Extract and feature ONLY the core product itself — "${product.name}" — as it relates to the brand "${brandAnalysis.brandName}". Never include surrounding elements. Copy the product exactly as photographed: no modifications, no text overlaid on it, no added decorations.

Write a short headline (2–5 words max).${ctaRule ? ` ${ctaRule}` : " Do NOT add any CTA."} No logo.

STRICT RULES:
- Use ONLY real information provided. Never invent prices, claims, percentages, or reviews.
- Brand name is "${brandAnalysis.brandName}" — exact spelling.
- ALL text in French.${storyRule}`;
    }

    // ── IMAGE ONLY: skip Haiku copy to maximize time for Gemini ──
    console.log(`[generate-ad] Calling Gemini (${referenceImages.length} refs)...`);

    const visualResult = await generateImage(visualPrompt, aspectRatio, referenceImages, 1);

    if (!visualResult) {
      console.error("[generate-ad] Gemini returned null — image generation failed after all retries");
      // Refund the credit since generation failed
      if (!skipCreditCheck && creditCost > 0) {
        const { addCredits } = await import("@/lib/supabase/subscriptions");
        await addCredits(user.id, creditCost);
      }
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

    const adId = `ad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // ── Save ad server-side to Supabase (survives client refresh) ──
    try {
      const { data: brandRow } = await supabase
        .from("brand_analyses")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (brandRow) {
        const ext = finalImage.mimeType?.includes("png") ? "png" : "jpg";
        const storagePath = `${user.id}/${brandRow.id}/${adId}.${ext}`;

        // Upload image to storage
        const imageBuffer = Buffer.from(finalImage.imageBase64, "base64");
        await supabase.storage
          .from("generated-ads")
          .upload(storagePath, imageBuffer, { contentType: finalImage.mimeType || "image/png" });

        // Save metadata
        await supabase.from("generated_ads").insert({
          id: adId,
          user_id: user.id,
          brand_analysis_id: brandRow.id,
          format,
          image_path: storagePath,
          headline: copy.headline,
          body_text: copy.bodyText,
          call_to_action: copy.callToAction,
          product_local_id: product.id || null,
          offer_local_id: offer?.id || null,
          template_id: actualTemplateId,
          is_favorite: false,
          debug_info: JSON.stringify({
            geminiPrompt: visualPrompt,
            sceneDescription,
            templateType: metadata?.templateType || null,
          }),
        });
        console.log(`[generate-ad] Ad saved server-side: ${adId}`);
      }
    } catch (saveErr) {
      console.error("[generate-ad] Server-side save failed (ad still returned to client):", saveErr);
    }

    return NextResponse.json({
      id: adId,
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
      _savedToDb: true,
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
