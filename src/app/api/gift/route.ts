import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Get user's brand analysis
    const { data: brand } = await supabase
      .from("brand_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!brand) {
      return NextResponse.json({ error: "Configurez votre marque d'abord" }, { status: 400 });
    }

    const brandAnalysis = brand.analysis_data;
    const products = brandAnalysis?.products || [];
    if (products.length === 0) {
      return NextResponse.json({ error: "Aucun produit configuré" }, { status: 400 });
    }

    // Pick random product
    const product = products[Math.floor(Math.random() * products.length)];

    // Pick random format
    const format = Math.random() > 0.5 ? "square" : "story";

    // Generate via internal API call
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://kult-ads.vercel.app";

    // Get product image
    const { data: images } = await supabase
      .from("uploaded_images")
      .select("*")
      .eq("user_id", user.id)
      .eq("brand_analysis_id", brand.id)
      .eq("is_logo", false)
      .limit(1);

    let productImageBase64: string | undefined;
    let productImageMimeType: string | undefined;

    if (images && images[0]) {
      const { data: fileData } = await supabase.storage
        .from("user-images")
        .download(images[0].storage_path);
      if (fileData) {
        const buffer = await fileData.arrayBuffer();
        productImageBase64 = Buffer.from(buffer).toString("base64");
        productImageMimeType = images[0].mime_type;
      }
    }

    // Get logo
    const { data: logoRows } = await supabase
      .from("uploaded_images")
      .select("*")
      .eq("user_id", user.id)
      .eq("brand_analysis_id", brand.id)
      .eq("is_logo", true)
      .limit(1);

    let brandLogoBase64: string | undefined;
    let brandLogoMimeType: string | undefined;

    if (logoRows && logoRows[0]) {
      const { data: logoFile } = await supabase.storage
        .from("user-images")
        .download(logoRows[0].storage_path);
      if (logoFile) {
        const buffer = await logoFile.arrayBuffer();
        brandLogoBase64 = Buffer.from(buffer).toString("base64");
        brandLogoMimeType = logoRows[0].mime_type;
      }
    }

    // Select a random template
    const templateRes = await fetch(`${origin}/api/templates/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, count: 1 }),
    });

    let templateId: string | undefined;
    if (templateRes.ok) {
      const { templateIds } = await templateRes.json();
      templateId = templateIds?.[0];
    }

    // Generate the ad
    const genRes = await fetch(`${origin}/api/generate-ad`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `sb-access-token=${user.id}`, // Pass auth context
      },
      body: JSON.stringify({
        brandAnalysis,
        product,
        productImageBase64,
        productImageMimeType,
        brandLogoBase64,
        brandLogoMimeType,
        format,
        templateId,
        isGift: true,
        skipCreditCheck: true, // Don't deduct credits for gifts
      }),
    });

    if (!genRes.ok) {
      const err = await genRes.text();
      console.error("[gift] Generation failed:", err);
      return NextResponse.json({ error: "Génération échouée" }, { status: 500 });
    }

    const adData = await genRes.json();

    // Mark gift as completed
    await supabase
      .from("daily_gifts")
      .update({
        status: "completed",
        generated_ad_id: adData.id,
      })
      .eq("id", gift.id);

    return NextResponse.json({
      gift: {
        id: gift.id,
        status: "completed",
        ad: adData,
      },
    });
  } catch (err) {
    console.error("[gift] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — mark gift as seen
export async function PATCH() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const today = new Date().toISOString().split("T")[0];

    await supabase
      .from("daily_gifts")
      .update({ seen: true })
      .eq("user_id", user.id)
      .eq("gift_date", today);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
