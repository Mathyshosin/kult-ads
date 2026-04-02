import { createClient } from "./client";
import type { BrandAnalysis, Product, Offer, UploadedImage, GeneratedAd } from "../types";

const supabase = () => createClient();

// ── Helper: base64 → Blob ──
function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

// ══════════════════════════════════════════
// Brand Analysis CRUD
// ══════════════════════════════════════════

export async function saveBrandAnalysis(
  userId: string,
  analysis: BrandAnalysis,
  existingId?: string
): Promise<string> {
  const sb = supabase();

  // Upsert brand_analyses row
  const row = {
    id: existingId || undefined,
    user_id: userId,
    url: analysis.url,
    brand_name: analysis.brandName,
    brand_description: analysis.brandDescription,
    tone: analysis.tone,
    colors: analysis.colors,
    target_audience: analysis.targetAudience,
    unique_selling_points: analysis.uniqueSellingPoints,
    competitor_products: analysis.competitorProducts || [],
  };

  const { data, error } = existingId
    ? await sb.from("brand_analyses").update(row).eq("id", existingId).select("id").single()
    : await sb.from("brand_analyses").insert(row).select("id").single();

  if (error) throw new Error(`Erreur sauvegarde analyse: ${error.message}`);
  const brandAnalysisId = data.id;

  // Replace products: delete old, insert new
  await sb.from("products").delete().eq("brand_analysis_id", brandAnalysisId);
  if (analysis.products.length > 0) {
    const productRows = analysis.products.map((p) => ({
      brand_analysis_id: brandAnalysisId,
      user_id: userId,
      local_id: p.id,
      name: p.name,
      description: p.description,
      price: p.price || null,
      original_price: p.originalPrice || null,
      sale_price: p.salePrice || null,
      features: p.features,
    }));
    const { error: pErr } = await sb.from("products").insert(productRows);
    if (pErr) console.error("Error saving products:", pErr.message);
  }

  // Replace offers: delete old, insert new
  await sb.from("offers").delete().eq("brand_analysis_id", brandAnalysisId);
  if (analysis.offers.length > 0) {
    const offerRows = analysis.offers.map((o) => ({
      brand_analysis_id: brandAnalysisId,
      user_id: userId,
      local_id: o.id,
      title: o.title,
      description: o.description,
      discount_type: o.discountType || null,
      discount_value: o.discountValue || null,
      original_price: o.originalPrice || null,
      sale_price: o.salePrice || null,
      product_local_id: o.productId || null,
      valid_until: o.validUntil || null,
    }));
    const { error: oErr } = await sb.from("offers").insert(offerRows);
    if (oErr) console.error("Error saving offers:", oErr.message);
  }

  return brandAnalysisId;
}

export async function loadLatestBrandAnalysis(
  userId: string
): Promise<{ analysis: BrandAnalysis; id: string } | null> {
  const sb = supabase();

  const { data: ba, error } = await sb
    .from("brand_analyses")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !ba) return null;

  // Load products
  const { data: products } = await sb
    .from("products")
    .select("*")
    .eq("brand_analysis_id", ba.id);

  // Load offers
  const { data: offers } = await sb
    .from("offers")
    .select("*")
    .eq("brand_analysis_id", ba.id);

  const analysis: BrandAnalysis = {
    url: ba.url,
    brandName: ba.brand_name,
    brandDescription: ba.brand_description || "",
    tone: ba.tone || "",
    colors: ba.colors || [],
    targetAudience: ba.target_audience || "",
    uniqueSellingPoints: ba.unique_selling_points || [],
    competitorProducts: ba.competitor_products || [],
    products: (products || []).map((p: Record<string, unknown>) => ({
      id: p.local_id as string,
      name: p.name as string,
      description: (p.description as string) || "",
      price: (p.price as string) || undefined,
      originalPrice: (p.original_price as string) || undefined,
      salePrice: (p.sale_price as string) || undefined,
      features: (p.features as string[]) || [],
    })),
    offers: (offers || []).map((o: Record<string, unknown>) => ({
      id: o.local_id as string,
      title: o.title as string,
      description: (o.description as string) || "",
      discountType: (o.discount_type as string) || undefined,
      discountValue: (o.discount_value as string) || undefined,
      originalPrice: (o.original_price as string) || undefined,
      salePrice: (o.sale_price as string) || undefined,
      productId: (o.product_local_id as string) || undefined,
      validUntil: (o.valid_until as string) || undefined,
    })),
  };

  return { analysis, id: ba.id };
}

export async function loadUserHistory(
  userId: string
): Promise<Array<{ id: string; brandName: string; url: string; updatedAt: string }>> {
  const sb = supabase();
  const { data, error } = await sb
    .from("brand_analyses")
    .select("id, brand_name, url, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map((d: Record<string, unknown>) => ({
    id: d.id as string,
    brandName: d.brand_name as string,
    url: d.url as string,
    updatedAt: d.updated_at as string,
  }));
}

// ══════════════════════════════════════════
// Image Storage
// ══════════════════════════════════════════

export async function uploadImage(
  userId: string,
  brandAnalysisId: string,
  base64: string,
  mimeType: string,
  fileName: string,
  productLocalId?: string
): Promise<{ storagePath: string; publicUrl: string }> {
  const sb = supabase();
  const ext = mimeType.split("/")[1] || "png";
  const storagePath = `${userId}/${brandAnalysisId}/products/${Date.now()}-${fileName}.${ext}`;

  const blob = base64ToBlob(base64, mimeType);
  const { error: uploadErr } = await sb.storage
    .from("user-images")
    .upload(storagePath, blob, { contentType: mimeType });

  if (uploadErr) throw new Error(`Upload error: ${uploadErr.message}`);

  // Save metadata in DB
  await sb.from("uploaded_images").insert({
    user_id: userId,
    brand_analysis_id: brandAnalysisId,
    storage_path: storagePath,
    mime_type: mimeType,
    name: fileName,
    product_local_id: productLocalId || null,
    is_logo: false,
  });

  const { data: urlData } = sb.storage
    .from("user-images")
    .getPublicUrl(storagePath);

  return { storagePath, publicUrl: urlData.publicUrl };
}

export async function uploadBrandLogo(
  userId: string,
  brandAnalysisId: string,
  base64: string,
  mimeType: string
): Promise<{ storagePath: string; publicUrl: string }> {
  const sb = supabase();
  const ext = mimeType.split("/")[1] || "png";
  const storagePath = `${userId}/${brandAnalysisId}/logo/logo.${ext}`;

  const blob = base64ToBlob(base64, mimeType);

  // Upsert (overwrite existing logo)
  const { error: uploadErr } = await sb.storage
    .from("user-images")
    .upload(storagePath, blob, { contentType: mimeType, upsert: true });

  if (uploadErr) throw new Error(`Logo upload error: ${uploadErr.message}`);

  // Remove old logo metadata, insert new
  await sb
    .from("uploaded_images")
    .delete()
    .eq("user_id", userId)
    .eq("brand_analysis_id", brandAnalysisId)
    .eq("is_logo", true);

  await sb.from("uploaded_images").insert({
    user_id: userId,
    brand_analysis_id: brandAnalysisId,
    storage_path: storagePath,
    mime_type: mimeType,
    name: "logo",
    is_logo: true,
  });

  const { data: urlData } = sb.storage
    .from("user-images")
    .getPublicUrl(storagePath);

  return { storagePath, publicUrl: urlData.publicUrl };
}

export async function loadUploadedImages(
  userId: string,
  brandAnalysisId: string
): Promise<{ images: UploadedImage[]; logo: { base64: string; mimeType: string; previewUrl: string } | null }> {
  const sb = supabase();

  const { data: rows } = await sb
    .from("uploaded_images")
    .select("*")
    .eq("user_id", userId)
    .eq("brand_analysis_id", brandAnalysisId);

  if (!rows || rows.length === 0) return { images: [], logo: null };

  // Download all images in parallel for speed
  const results = await Promise.all(
    rows.map(async (row) => {
      try {
        const { data: fileData } = await sb.storage
          .from("user-images")
          .download(row.storage_path);

        if (!fileData) return null;

        const buffer = await fileData.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        return { row, base64 };
      } catch {
        return null;
      }
    })
  );

  const images: UploadedImage[] = [];
  let logo: { base64: string; mimeType: string; previewUrl: string } | null = null;

  for (const result of results) {
    if (!result) continue;
    const { row, base64 } = result;
    const previewUrl = `data:${row.mime_type};base64,${base64}`;

    if (row.is_logo) {
      logo = { base64, mimeType: row.mime_type, previewUrl };
    } else {
      images.push({
        id: row.id,
        previewUrl,
        base64,
        mimeType: row.mime_type,
        name: row.name,
        productId: row.product_local_id || undefined,
        isAiGenerated: false,
      });
    }
  }

  return { images, logo };
}

export async function deleteImage(
  userId: string,
  imageId: string,
  imageName?: string
): Promise<void> {
  const sb = supabase();

  // Try by ID first (matches when image was loaded from Supabase)
  let { data: row } = await sb
    .from("uploaded_images")
    .select("id, storage_path")
    .eq("id", imageId)
    .eq("user_id", userId)
    .single();

  // Fallback: try by name (for images uploaded in current session with local ID)
  if (!row && imageName) {
    const { data: byName } = await sb
      .from("uploaded_images")
      .select("id, storage_path")
      .eq("name", imageName)
      .eq("user_id", userId)
      .eq("is_logo", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    row = byName;
  }

  if (row) {
    if (row.storage_path) {
      await sb.storage.from("user-images").remove([row.storage_path]);
    }
    await sb.from("uploaded_images").delete().eq("id", row.id);
  }
}

export async function deleteBrandLogo(
  userId: string,
  brandAnalysisId: string
): Promise<void> {
  const sb = supabase();

  // Find logo rows
  const { data: rows } = await sb
    .from("uploaded_images")
    .select("id, storage_path")
    .eq("user_id", userId)
    .eq("brand_analysis_id", brandAnalysisId)
    .eq("is_logo", true);

  if (rows && rows.length > 0) {
    const paths = rows.map((r) => r.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await sb.storage.from("user-images").remove(paths);
    }
    const ids = rows.map((r) => r.id);
    await sb.from("uploaded_images").delete().in("id", ids);
  }
}

// ══════════════════════════════════════════
// Generated Ads
// ══════════════════════════════════════════

export async function saveGeneratedAd(
  userId: string,
  brandAnalysisId: string,
  ad: GeneratedAd
): Promise<string> {
  const sb = supabase();
  const ext = ad.mimeType?.split("/")[1] || "png";
  const storagePath = `${userId}/${brandAnalysisId}/${ad.id}.${ext}`;

  // Upload image to storage
  const blob = base64ToBlob(ad.imageBase64, ad.mimeType || "image/png");
  await sb.storage
    .from("generated-ads")
    .upload(storagePath, blob, { contentType: ad.mimeType || "image/png" });

  // Save metadata
  const { error } = await sb.from("generated_ads").insert({
    user_id: userId,
    brand_analysis_id: brandAnalysisId,
    format: ad.format,
    image_path: storagePath,
    headline: ad.headline,
    body_text: ad.bodyText,
    call_to_action: ad.callToAction,
    product_local_id: ad.productId || null,
    offer_local_id: ad.offerId || null,
    template_id: ad.templateId || null,
    is_favorite: ad.isFavorite || false,
    debug_info: ad._debug ? JSON.stringify(ad._debug) : null,
  });

  if (error) console.error("Error saving ad:", error.message);
  return storagePath;
}

export async function updateGeneratedAdImage(
  userId: string,
  brandAnalysisId: string,
  adId: string,
  ad: GeneratedAd
): Promise<void> {
  const sb = supabase();
  const ext = ad.mimeType?.split("/")[1] || "png";
  const storagePath = `${userId}/${brandAnalysisId}/${adId}-v${Date.now()}.${ext}`;

  // Upload new image
  const blob = base64ToBlob(ad.imageBase64, ad.mimeType || "image/png");
  const { error: uploadErr } = await sb.storage
    .from("generated-ads")
    .upload(storagePath, blob, { contentType: ad.mimeType || "image/png", upsert: true });
  if (uploadErr) console.error("Error uploading updated ad image:", uploadErr.message);

  // Update metadata row
  const { error } = await sb.from("generated_ads")
    .update({
      image_path: storagePath,
      headline: ad.headline,
      body_text: ad.bodyText,
      call_to_action: ad.callToAction,
      debug_info: ad._debug ? JSON.stringify(ad._debug) : null,
    })
    .eq("id", adId)
    .eq("user_id", userId);
  if (error) console.error("Error updating ad:", error.message);
}

export async function loadGeneratedAds(
  userId: string,
  brandAnalysisId: string
): Promise<GeneratedAd[]> {
  const sb = supabase();

  const { data: rows } = await sb
    .from("generated_ads")
    .select("*")
    .eq("user_id", userId)
    .eq("brand_analysis_id", brandAnalysisId)
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) return [];

  // Get signed URLs in batch (parallel, not sequential)
  const paths = rows.map((r) => r.image_path);
  const { data: signedUrls } = await sb.storage
    .from("generated-ads")
    .createSignedUrls(paths, 3600);

  // Build a map of path → signed URL
  const urlMap = new Map<string, string>();
  if (signedUrls) {
    for (const item of signedUrls) {
      if (item.signedUrl) urlMap.set(item.path || "", item.signedUrl);
    }
  }

  return rows.map((row) => {
    let debugInfo: GeneratedAd["_debug"] | undefined;
    if (row.debug_info) {
      try {
        debugInfo = typeof row.debug_info === "string"
          ? JSON.parse(row.debug_info)
          : row.debug_info;
      } catch { /* ignore */ }
    }

    return {
      id: row.id,
      format: row.format,
      imageBase64: "",
      imageUrl: urlMap.get(row.image_path) || "",
      mimeType: row.image_path.endsWith(".png") ? "image/png" : "image/jpeg",
      headline: row.headline || "",
      bodyText: row.body_text || "",
      callToAction: row.call_to_action || "",
      productId: row.product_local_id || undefined,
      offerId: row.offer_local_id || undefined,
      templateId: row.template_id || undefined,
      isFavorite: row.is_favorite || false,
      timestamp: new Date(row.created_at).getTime(),
      _debug: debugInfo,
      storagePath: row.image_path,
    };
  });
}

export async function deleteGeneratedAd(
  userId: string,
  adId: string
): Promise<void> {
  const sb = supabase();

  // Get storage path first
  const { data: row } = await sb
    .from("generated_ads")
    .select("image_path")
    .eq("id", adId)
    .eq("user_id", userId)
    .single();

  if (row) {
    await sb.storage.from("generated-ads").remove([row.image_path]);
    await sb.from("generated_ads").delete().eq("id", adId);
  }
}

export async function updateGeneratedAdFavorite(
  userId: string,
  adId: string,
  isFavorite: boolean
): Promise<void> {
  const sb = supabase();
  const { error } = await sb
    .from("generated_ads")
    .update({ is_favorite: isFavorite })
    .eq("id", adId)
    .eq("user_id", userId);
  if (error) console.error("Error updating favorite:", error.message);
}

export async function deleteAllGeneratedAds(
  userId: string,
  brandAnalysisId: string
): Promise<void> {
  const sb = supabase();

  // Get all ad storage paths
  const { data: rows } = await sb
    .from("generated_ads")
    .select("id, image_path")
    .eq("user_id", userId)
    .eq("brand_analysis_id", brandAnalysisId);

  if (rows && rows.length > 0) {
    // Delete storage files
    const paths = rows.map((r) => r.image_path).filter(Boolean);
    if (paths.length > 0) {
      await sb.storage.from("generated-ads").remove(paths);
    }
    // Delete DB rows
    await sb
      .from("generated_ads")
      .delete()
      .eq("user_id", userId)
      .eq("brand_analysis_id", brandAnalysisId);
  }
}

// ── Get recently used template IDs for a user (for randomization) ──
export async function getRecentTemplateIds(
  userId: string,
  limit: number = 5
): Promise<string[]> {
  const sb = supabase();
  const { data } = await sb
    .from("generated_ads")
    .select("template_id")
    .eq("user_id", userId)
    .not("template_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];
  return data.map((r) => r.template_id as string).filter(Boolean);
}
