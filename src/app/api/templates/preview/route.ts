import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — return template preview images as data URLs (for landing page)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("ad_templates")
      .select("id, filename, mime_type, format")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ templates: [] });
    }

    // Download images in parallel
    const templates = await Promise.all(
      rows.map(async (row) => {
        try {
          const { data: fileData } = await supabase.storage
            .from("templates")
            .download(row.filename);
          if (!fileData) return null;
          const buffer = await fileData.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          return {
            id: row.id,
            format: row.format,
            previewUrl: `data:${row.mime_type};base64,${base64}`,
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({
      templates: templates.filter(Boolean),
    });
  } catch {
    return NextResponse.json({ templates: [] });
  }
}
