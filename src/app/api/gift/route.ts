import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BrandAnalysis } from "@/lib/types";

// GET — check if user has a pending gift today
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ gift: null });

    const today = new Date().toISOString().split("T")[0];

    const { data: gift } = await supabase
      .from("daily_gifts")
      .select("*")
      .eq("user_id", user.id)
      .eq("gift_date", today)
      .single();

    if (!gift) return NextResponse.json({ gift: null });

    // If gift is completed, return the ad ID
    if (gift.status === "completed") {
      return NextResponse.json({
        gift: {
          id: gift.id,
          status: "completed",
          adId: gift.generated_ad_id,
          seen: gift.seen,
        },
      });
    }

    // If gift is pending, return pending status
    return NextResponse.json({
      gift: {
        id: gift.id,
        status: "pending",
        seen: gift.seen,
      },
    });
  } catch {
    return NextResponse.json({ gift: null });
  }
}

// POST — trigger gift generation or mark as seen
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const today = new Date().toISOString().split("T")[0];

    // Find today's pending gift
    const { data: gift } = await supabase
      .from("daily_gifts")
      .select("*")
      .eq("user_id", user.id)
      .eq("gift_date", today)
      .eq("status", "pending")
      .single();

    if (!gift) {
      return NextResponse.json({ error: "Pas de cadeau en attente" }, { status: 404 });
    }

    // Load brand analysis using server-side Supabase client
    const { data: ba } = await supabase
      .from("brand_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ba) {
      return NextResponse.json({ error: "Configurez votre marque d'abord" }, { status: 400 });
    }

    const brandAnalysisId = ba.id;

    // Load products
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("brand_analysis_id", brandAnalysisId);

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "Aucun produit configuré" }, { status: 400 });
    }

    // Load offers
    const { data: offers } = await supabase
      .from("offers")
      .select("*")
      .eq("brand_analysis_id", brandAnalysisId);

    // Build brand analysis object
    const brandAnalysis: BrandAnalysis = {
      url: ba.url,
      brandName: ba.brand_name,
      brandDescription: ba.brand_description || "",
      tone: ba.tone || "",
      colors: ba.colors || [],
      targetAudience: ba.target_audience || "",
      uniqueSellingPoints: ba.unique_selling_points || [],
      competitorProducts: ba.competitor_products || [],
      products: products.map((p) => ({
        id: p.local_id,
        name: p.name,
        description: p.description || "",
        price: p.price || undefined,
        originalPrice: p.original_price || undefined,
        salePrice: p.sale_price || undefined,
        features: p.features || [],
      })),
      offers: (offers || []).map((o) => ({
        id: o.local_id,
        title: o.title,
        description: o.description || "",
        discountType: o.discount_type || undefined,
        discountValue: o.discount_value || undefined,
        originalPrice: o.original_price || undefined,
        salePrice: o.sale_price || undefined,
        productId: o.product_local_id || undefined,
        validUntil: o.valid_until || undefined,
      })),
    };

    // Pick random product
    const product = brandAnalysis.products[Math.floor(Math.random() * brandAnalysis.products.length)];
    const offer = brandAnalysis.offers.find((o) => o.productId === product.id) || null;

    // Pick random format
    const format: "square" | "story" = Math.random() > 0.5 ? "square" : "story";

    // Load images (product + logo)
    const { data: imgRows } = await supabase
      .from("uploaded_images")
      .select("*")
      .eq("user_id", user.id)
      .eq("brand_analysis_id", brandAnalysisId);

    let productImageBase64: string | undefined;
    let productImageMimeType: string | undefined;
    let brandLogoBase64: string | undefined;
    let brandLogoMimeType: string | undefined;

    if (imgRows) {
      // Get product image
      const productImgRow = imgRows.find((r) => !r.is_logo) ;
      if (productImgRow) {
        const { data: fileData } = await supabase.storage
          .from("user-images")
          .download(productImgRow.storage_path);
        if (fileData) {
          const buffer = await fileData.arrayBuffer();
          productImageBase64 = Buffer.from(buffer).toString("base64");
          productImageMimeType = productImgRow.mime_type;
        }
      }

      // Get logo
      const logoRow = imgRows.find((r) => r.is_logo);
      if (logoRow) {
        const { data: logoFile } = await supabase.storage
          .from("user-images")
          .download(logoRow.storage_path);
        if (logoFile) {
          const buffer = await logoFile.arrayBuffer();
          brandLogoBase64 = Buffer.from(buffer).toString("base64");
          brandLogoMimeType = logoRow.mime_type;
        }
      }
    }

    // Select a random template
    let templateId: string | undefined;
    try {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://kult-ads.vercel.app";
      const templateRes = await fetch(`${origin}/api/templates/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, count: 1 }),
      });
      if (templateRes.ok) {
        const { templateIds } = await templateRes.json();
        templateId = templateIds?.[0];
      }
    } catch { /* continue without template */ }

    // Return generation payload — client will call /api/generate-ad with proper auth cookies
    return NextResponse.json({
      gift: {
        id: gift.id,
        status: "ready_to_generate",
      },
      generatePayload: {
        brandAnalysis,
        product,
        offer,
        productImageBase64,
        productImageMimeType,
        brandLogoBase64,
        brandLogoMimeType,
        format,
        templateId,
        skipCreditCheck: true,
        isGift: true,
      },
    });
  } catch (err) {
    console.error("[gift] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — mark gift as completed or seen
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const today = new Date().toISOString().split("T")[0];
    const body = await request.json().catch(() => ({}));

    if (body.action === "complete" && body.adId) {
      // Mark as completed with ad ID
      await supabase
        .from("daily_gifts")
        .update({ status: "completed", generated_ad_id: body.adId })
        .eq("user_id", user.id)
        .eq("gift_date", today);
    } else {
      // Mark as seen
      await supabase
        .from("daily_gifts")
        .update({ seen: true })
        .eq("user_id", user.id)
        .eq("gift_date", today);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
