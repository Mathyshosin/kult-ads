import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { seedTemplatesToDb } from "@/lib/supabase/templates";

// POST — seed existing templates from templates.json into Supabase
export async function POST() {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

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

    const count = await seedTemplatesToDb(templates);

    return NextResponse.json({
      success: true,
      seeded: count,
      total: templates.length,
    });
  } catch (error) {
    console.error("[templates/seed] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
