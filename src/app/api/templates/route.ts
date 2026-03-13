import { NextResponse } from "next/server";
import {
  getTemplates,
  addTemplate,
  removeTemplate,
  updateTemplate,
} from "@/lib/template-store";

// GET — list all templates
export async function GET() {
  const templates = getTemplates();
  return NextResponse.json({ templates });
}

// POST — add, remove, or update templates
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

      const template = addTemplate(
        name || "Template sans nom",
        format || "square",
        category || "promo",
        imageBase64,
        mimeType
      );

      return NextResponse.json({ template });
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
