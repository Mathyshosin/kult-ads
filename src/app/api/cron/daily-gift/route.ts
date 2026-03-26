import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Use service role key for cron (no user session)
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in dev without secret
    if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = getServiceClient();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    // 1. Get all paying users (pro or agency)
    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("user_id, plan")
      .in("plan", ["pro", "agency"]);

    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: "No paying users", giftsCreated: 0 });
    }

    // 2. Check who already received a gift today
    const { data: existingGifts } = await supabase
      .from("daily_gifts")
      .select("user_id")
      .eq("gift_date", today);

    const alreadyGifted = new Set((existingGifts || []).map((g) => g.user_id));

    // 3. Create gift slots for users who haven't received one today
    const newGifts = subs
      .filter((s) => !alreadyGifted.has(s.user_id))
      .map((s) => ({
        user_id: s.user_id,
        gift_date: today,
        status: "pending", // will be generated when user opens dashboard
      }));

    if (newGifts.length === 0) {
      return NextResponse.json({ message: "All users already gifted today", giftsCreated: 0 });
    }

    const { error } = await supabase.from("daily_gifts").insert(newGifts);
    if (error) throw error;

    console.log(`[daily-gift] Created ${newGifts.length} gift slots for ${today}`);
    return NextResponse.json({ message: "Gift slots created", giftsCreated: newGifts.length });
  } catch (err) {
    console.error("[daily-gift] Error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
