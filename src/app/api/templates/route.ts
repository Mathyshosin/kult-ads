import { NextResponse } from "next/server";
import {
  getTemplates,
  addTemplate,
  removeTemplate,
  updateTemplate,
} from "@/lib/template-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

// GET — list all templates
export async function GET() {
  const templates = await getTemplates();
  return NextResponse.json({ templates });
}

// POST — add, remove, or update templates
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();

    // Action: add new template (legacy — sends base64 through API)
    if (body.action === "add") {
      const { name, format, category, imageBase64, mimeType } = body;

      if (!imageBase64 || !mimeType) {
        return NextResponse.json(
          { error: "Image manquante" },
          { status: 400 }
        );
      }

      const template = await addTemplate(
        name || "Template sans nom",
        format || "square",
        category || "promo",
        imageBase64,
        mimeType
      );

      if (!template) {
        return NextResponse.json(
          { error: "Échec de l'ajout du template" },
          { status: 500 }
        );
      }

      return NextResponse.json({ template });
    }

    // Action: add-metadata — image already uploaded to Supabase Storage from client
    if (body.action === "add-metadata") {
      const { id, name, format, category, filename, mimeType, imageSource } = body;

      if (!id || !filename) {
        return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
      }

      const { addTemplateToDb } = await import("@/lib/supabase/templates");
      const row = await addTemplateToDb({
        id,
        name: name || "Template sans nom",
        format: format || "square",
        category: category || "promo",
        filename,
        mimeType: mimeType || "image/png",
        imageSource: imageSource || "supabase",
      });

      if (!row) {
        return NextResponse.json({ error: "Échec sauvegarde métadonnées" }, { status: 500 });
      }

      return NextResponse.json({ success: true, template: row });
    }

    // Action: remove
    if (body.action === "remove" && body.id) {
      await removeTemplate(body.id);
      return NextResponse.json({ success: true });
    }

    // Action: update metadata
    if (body.action === "update" && body.id) {
      const { name, format, category, tags } = body;
      await updateTemplate(body.id, {
        ...(name !== undefined && { name }),
        ...(format !== undefined && { format }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
