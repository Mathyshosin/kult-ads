import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { updateTemplatePrompt } from "@/lib/supabase/templates";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { templateId, prompt } = await req.json();
  if (!templateId) {
    return NextResponse.json({ error: "templateId required" }, { status: 400 });
  }

  const success = await updateTemplatePrompt(templateId, prompt || null);
  if (!success) {
    return NextResponse.json({ error: "Erreur sauvegarde" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
