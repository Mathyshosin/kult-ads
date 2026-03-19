import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPendingTemplates,
  updatePendingStatus,
  getPendingImageBase64,
  deletePendingImage,
} from "@/lib/supabase/pending-templates";
import { addTemplate, updateTemplate } from "@/lib/template-store";

const ADMIN_EMAIL = "mathys.hosin@gmail.com";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user;
}

// GET — list pending templates
export async function GET() {
  const user = await checkAdmin();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const pending = await getPendingTemplates();
  console.log(`[admin] ${pending.length} pending templates, imageUrls: ${pending.map(p => p.imageUrl ? `OK (${p.imageUrl.length} chars)` : "EMPTY").join(", ")}`);
  return NextResponse.json({ pending });
}

// POST — approve or reject
export async function POST(request: Request) {
  const user = await checkAdmin();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { action, id, filename, name, format, category, tags } = await request.json();

  if (action === "approve") {
    if (!id || !filename || !name || !format || !category) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Download the image from pending bucket
    const imageData = await getPendingImageBase64(filename);
    if (!imageData) {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }

    // Add to main templates library
    const template = await addTemplate(name, format, category, imageData.imageBase64, imageData.mimeType);
    if (!template) {
      return NextResponse.json({ error: "Échec de l'ajout au catalogue" }, { status: 500 });
    }

    // Update tags if provided
    if (tags) {
      await updateTemplate(template.id, { tags });
    }

    // Mark as approved + cleanup pending bucket
    await updatePendingStatus(id, "approved");
    await deletePendingImage(filename);

    return NextResponse.json({ success: true, templateId: template.id });

  } else if (action === "reject") {
    if (!id || !filename) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    await updatePendingStatus(id, "rejected");
    await deletePendingImage(filename);

    return NextResponse.json({ success: true });

  } else {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }
}
