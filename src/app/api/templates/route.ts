import { NextResponse } from "next/server";
import {
  getTemplates,
  addTemplate,
  removeTemplate,
  updateTemplate,
} from "@/lib/template-store";

// GET — list all templates
export async function GET() {
  const templates = await getTemplates();
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

      const template = await addTemplate(
        name || "Template sans nom",
        format || "square",
        category || "promo",
        imageBase64,
        mimeType
      );

      if (!template) {
        return NextResponse.json(
          { error: "Erreur lors de l'ajout du template" },
          { status: 500 }
        );
      }

      return NextResponse.json({ template });
    }

    // Action: remove
    if (body.action === "remove" && body.id) {
      const success = await removeTemplate(body.id);
      if (!success) {
        return NextResponse.json(
          { error: "Erreur lors de la suppression" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    // Action: update metadata
    if (body.action === "update" && body.id) {
      const { name, format, category } = body;
      const success = await updateTemplate(body.id, {
        ...(name !== undefined && { name }),
        ...(format !== undefined && { format }),
        ...(category !== undefined && { category }),
      });
      if (!success) {
        return NextResponse.json(
          { error: "Erreur lors de la mise à jour" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
