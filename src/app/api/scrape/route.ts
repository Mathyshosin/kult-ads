import { NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/scraper";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    const data = await scrapeUrl(normalizedUrl);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors du scraping";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
