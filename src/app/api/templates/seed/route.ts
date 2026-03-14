import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

// POST — seed existing templates from templates.json into Supabase
export async function POST() {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié", hint: "Connecte-toi d'abord" }, { status: 401 });
    }
    console.log("[templates/seed] Authenticated as:", user.id, user.email);

    // Read templates.json (local file, always readable)
    const dataFile = path.join(process.cwd(), "src/data/templates.json");
    const raw = fs.readFileSync(dataFile, "utf-8");
    const templates = JSON.parse(raw) as Array<{
      id: string;
      name: string;
      format: "square" | "story";
      category: string;
      filename: string;
      mimeType: string;
      tags?: { industry: string[]; adType: string[]; productType: string[] };
    }>;

    // Use the authenticated server client directly for seeding
    const rows = templates.map((t) => ({
      id: t.id,
      name: t.name,
      format: t.format,
      category: t.category,
      filename: t.filename,
      mime_type: t.mimeType,
      image_source: "local" as const,
      tags: t.tags || { industry: [], adType: [], productType: [] },
    }));

    // First check if table already has data
    const { data: existing, error: countErr } = await supabase
      .from("templates")
      .select("id");

    if (countErr) {
      return NextResponse.json({
        error: countErr.message,
        hint: countErr.hint,
        details: countErr.details,
        code: countErr.code,
        userId: user?.id || "no user"
      }, { status: 500 });
    }

    // If already seeded, skip
    if (existing && existing.length >= templates.length) {
      return NextResponse.json({
        success: true,
        seeded: 0,
        total: templates.length,
        message: "Already seeded",
        existing: existing.length,
      });
    }

    // Insert row by row to get precise errors
    let inserted = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const { error: insertErr } = await supabase
        .from("templates")
        .upsert(row, { onConflict: "id" });

      if (insertErr) {
        errors.push(`${row.id}: ${insertErr.message} (${insertErr.code})`);
      } else {
        inserted++;
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      seeded: inserted,
      total: templates.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[templates/seed] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
