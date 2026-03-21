import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "mathys.hosin@gmail.com";

// Service role client for admin queries (bypasses RLS)
function adminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  // 1. Check admin auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const admin = adminClient();

  try {
    // 2. Total users — count distinct user_id from brand_analyses
    const { count: totalUsers } = await admin
      .from("brand_analyses")
      .select("user_id", { count: "exact", head: true });

    // 3. Total ads generated
    const { count: totalAds } = await admin
      .from("generated_ads")
      .select("*", { count: "exact", head: true });

    // 4. Total templates
    const { count: totalTemplates } = await admin
      .from("templates")
      .select("*", { count: "exact", head: true });

    // 5. Ads generated today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: adsToday } = await admin
      .from("generated_ads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    // 6. Recent users (last 10 distinct user_ids from brand_analyses)
    const { data: recentUsersRaw } = await admin
      .from("brand_analyses")
      .select("user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    // Deduplicate by user_id, keep most recent
    const seenUsers = new Map<string, { user_id: string; created_at: string }>();
    for (const row of recentUsersRaw || []) {
      if (!seenUsers.has(row.user_id)) {
        seenUsers.set(row.user_id, row);
      }
    }
    const recentUsers = Array.from(seenUsers.values()).slice(0, 10);

    // Get email for each user via auth admin
    const recentUsersWithEmail = await Promise.all(
      recentUsers.map(async (u) => {
        const { data } = await admin.auth.admin.getUserById(u.user_id);
        // Count ads per user
        const { count: adCount } = await admin
          .from("generated_ads")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.user_id);
        return {
          user_id: u.user_id,
          email: data?.user?.email || "Inconnu",
          created_at: u.created_at,
          ad_count: adCount || 0,
        };
      })
    );

    // 7. Top templates by usage (generated_ads grouped by template_id)
    const { data: allAdsWithTemplate } = await admin
      .from("generated_ads")
      .select("template_id")
      .not("template_id", "is", null);

    const templateCounts = new Map<string, number>();
    for (const row of allAdsWithTemplate || []) {
      const tid = row.template_id as string;
      templateCounts.set(tid, (templateCounts.get(tid) || 0) + 1);
    }
    const topTemplatesRaw = Array.from(templateCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Get template details
    const templateIds = topTemplatesRaw.map(([id]) => id);
    const { data: templateDetails } = templateIds.length > 0
      ? await admin.from("templates").select("id, name, image_path").in("id", templateIds)
      : { data: [] };

    const templateMap = new Map(
      (templateDetails || []).map((t) => [t.id, t])
    );
    // Download template preview images in parallel
    const topTemplates = await Promise.all(
      topTemplatesRaw.map(async ([id, count]) => {
        const tpl = templateMap.get(id);
        let previewUrl = "";
        if (tpl?.image_path) {
          try {
            const { data: fileData } = await admin.storage
              .from("templates")
              .download(tpl.image_path);
            if (fileData) {
              const buffer = await fileData.arrayBuffer();
              const base64 = Buffer.from(buffer).toString("base64");
              const ext = tpl.image_path.endsWith(".png") ? "image/png" : "image/jpeg";
              previewUrl = `data:${ext};base64,${base64}`;
            }
          } catch { /* ignore */ }
        }
        return {
          template_id: id,
          count,
          name: tpl?.name || id,
          previewUrl,
        };
      })
    );

    // 8. Ads per day (last 7 days)
    const adsPerDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const { count } = await admin
        .from("generated_ads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString())
        .lte("created_at", dayEnd.toISOString());

      adsPerDay.push({
        date: dayStart.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
        count: count || 0,
      });
    }

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalAds: totalAds || 0,
      totalTemplates: totalTemplates || 0,
      adsToday: adsToday || 0,
      recentUsers: recentUsersWithEmail,
      topTemplates,
      adsPerDay,
    });
  } catch (err) {
    console.error("[admin/stats] Error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des stats" },
      { status: 500 }
    );
  }
}
