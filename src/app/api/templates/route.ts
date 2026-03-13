import { NextResponse } from "next/server";
import {
  getTemplates,
  addTemplate,
  removeTemplate,
  updateTemplate,
} from "@/lib/template-store";

// GET — list all templates (returns metadata only, no base64 for listing)
export async function GET() {
  const templates = getTemplates();
  // Return light version for listing (without heavy base64)
  const light = templates.map(({ imageBase64, ...rest }) => rest);
  return NextResponse.json({ templates: light });
}

// POST — add or manage templates
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Action: add new template
    if (body.action === "add") {
      const { name, format, category, imageBase64, mimeType } = body;

      if (!imageBase64 || !mimeType) {
        return NextResponse.json(
          { error: "Image manquante" },
          { status: 400 }
        );
      }

      const template = {
        id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name || "Template sans nom",
        format: format || "square",
        category: category || "promo",
        imageBase64,
        mimeType,
        previewUrl: `data:${mimeType};base64,${imageBase64}`,
      };

      addTemplate(template);
      return NextResponse.json({ template: { ...template, imageBase64: undefined } });
    }

    // Action: remove
    if (body.action === "remove" && body.id) {
      removeTemplate(body.id);
      return NextResponse.json({ success: true });
    }

    // Action: update metadata
    if (body.action === "update" && body.id) {
      const { name, format, category } = body;
      updateTemplate(body.id, {
        ...(name !== undefined && { name }),
        ...(format !== undefined && { format }),
        ...(category !== undefined && { category }),
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
