import { NextResponse } from "next/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";

function adminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — public stats for landing page (no auth needed)
export async function GET() {
  try {
    const supabase = adminClient();
    const { count } = await supabase
      .from("generated_ads")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      adsGenerated: count || 0,
    });
  } catch {
    return NextResponse.json({ adsGenerated: 0 });
  }
}
