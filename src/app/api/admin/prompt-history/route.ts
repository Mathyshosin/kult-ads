import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const sb = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ads } = await sb
      .from("generated_ads")
      .select("id, format, template_id, debug_info, created_at, image_path")
      .not("template_id", "is", null)
      .not("debug_info", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!ads) return NextResponse.json({ history: [] });

    // Get signed URLs for ad images
    const paths = ads.map((a) => a.image_path).filter(Boolean);
    const { data: signedUrls } = await sb.storage
      .from("generated-ads")
      .createSignedUrls(paths, 3600);

    const urlMap = new Map<string, string>();
    if (signedUrls) {
      for (const item of signedUrls) {
        if (item.signedUrl) urlMap.set(item.path || "", item.signedUrl);
      }
    }

    const history = ads.map((ad) => {
      let debug = ad.debug_info;
      if (typeof debug === "string") {
        try { debug = JSON.parse(debug); } catch { debug = null; }
      }

      return {
        id: ad.id,
        format: ad.format,
        templateId: ad.template_id,
        createdAt: ad.created_at,
        imageUrl: urlMap.get(ad.image_path) || "",
        prompt: debug?.geminiPrompt || "",
        templateType: debug?.templateType || "",
        referenceLabels: debug?.referenceImageLabels || [],
      };
    });

    return NextResponse.json({ history });
  } catch (err) {
    console.error("[admin/prompt-history] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
