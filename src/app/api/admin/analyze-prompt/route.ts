import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { getTemplateByIdWithImage } from "@/lib/template-store";
import { generateTemplatePrompt } from "@/lib/claude";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { templateId } = await req.json();
  if (!templateId) {
    return NextResponse.json({ error: "templateId required" }, { status: 400 });
  }

  const template = await getTemplateByIdWithImage(templateId);
  if (!template) {
    return NextResponse.json({ error: "Template introuvable" }, { status: 404 });
  }

  try {
    const prompt = await generateTemplatePrompt(template.imageBase64, template.mimeType);
    return NextResponse.json({ prompt });
  } catch (err) {
    console.error("[analyze-prompt] Error:", err);
    return NextResponse.json({ error: "Erreur analyse Claude" }, { status: 500 });
  }
}
