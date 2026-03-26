import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadLatestBrandAnalysis, loadUploadedImages } from "@/lib/supabase/sync";

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

    // Load brand analysis using the same function as the rest of the app
    const brandResult = await loadLatestBrandAnalysis(user.id);
    if (!brandResult) {
      return NextResponse.json({ error: "Configurez votre marque d'abord" }, { status: 400 });
    }

    const { analysis: brandAnalysis, id: brandAnalysisId } = brandResult;
    if (!brandAnalysis.products || brandAnalysis.products.length === 0) {
      return NextResponse.json({ error: "Aucun produit configuré" }, { status: 400 });
    }

    // Pick random product
    const product = brandAnalysis.products[Math.floor(Math.random() * brandAnalysis.products.length)];
    const offer = brandAnalysis.offers.find((o) => o.productId === product.id) || null;

    // Pick random format
    const format = Math.random() > 0.5 ? "square" : "story";

    // Load images (product + logo) in parallel
    const { images, logo } = await loadUploadedImages(user.id, brandAnalysisId);
    const productImage = images.find((img) => img.productId === product.id) || images[0];

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
        productImageBase64: productImage?.base64,
        productImageMimeType: productImage?.mimeType,
        brandLogoBase64: logo?.base64,
        brandLogoMimeType: logo?.mimeType,
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
