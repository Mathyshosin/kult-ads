import { createClient } from "./client";

const supabase = () => createClient();

export interface TemplateRow {
  id: string;
  name: string;
  format: "square" | "story";
  category: string;
  filename: string;
  mime_type: string;
  image_source: "local" | "supabase";
  tags: {
    industry: string[];
    adType: string[];
    productType: string[];
  };
  created_at: string;
  updated_at: string;
}

// ── List all templates ──
export async function getTemplatesFromDb(): Promise<TemplateRow[]> {
  const { data, error } = await supabase()
    .from("templates")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[supabase/templates] List error:", error);
    return [];
  }
  return (data || []) as TemplateRow[];
}

// ── Get a single template by ID ──
export async function getTemplateFromDb(
  id: string
): Promise<TemplateRow | null> {
  const { data, error } = await supabase()
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as TemplateRow;
}

// ── Add a new template ──
export async function addTemplateToDb(template: {
  id: string;
  name: string;
  format: "square" | "story";
  category: string;
  filename: string;
  mimeType: string;
  imageSource: "local" | "supabase";
  tags?: { industry: string[]; adType: string[]; productType: string[] };
}): Promise<TemplateRow | null> {
  const { data, error } = await supabase()
    .from("templates")
    .insert({
      id: template.id,
      name: template.name,
      format: template.format,
      category: template.category,
      filename: template.filename,
      mime_type: template.mimeType,
      image_source: template.imageSource,
      tags: template.tags || { industry: [], adType: [], productType: [] },
    })
    .select()
    .single();

  if (error) {
    console.error("[supabase/templates] Insert error:", error);
    return null;
  }
  return data as TemplateRow;
}

// ── Update template metadata ──
export async function updateTemplateInDb(
  id: string,
  partial: {
    name?: string;
    format?: string;
    category?: string;
    tags?: { industry: string[]; adType: string[]; productType: string[] };
  }
): Promise<boolean> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (partial.name !== undefined) updateData.name = partial.name;
  if (partial.format !== undefined) updateData.format = partial.format;
  if (partial.category !== undefined) updateData.category = partial.category;
  if (partial.tags !== undefined) updateData.tags = partial.tags;

  const { error } = await supabase()
    .from("templates")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("[supabase/templates] Update error:", error);
    return false;
  }
  return true;
}

// ── Remove a template ──
export async function removeTemplateFromDb(id: string): Promise<boolean> {
  // First get the template to check image_source
  const template = await getTemplateFromDb(id);
  if (!template) return false;

  // Delete image from Supabase Storage if it was uploaded there
  if (template.image_source === "supabase") {
    const { error: storageError } = await supabase()
      .storage
      .from("templates")
      .remove([template.filename]);

    if (storageError) {
      console.error("[supabase/templates] Storage delete error:", storageError);
    }
  }

  // Delete the row
  const { error } = await supabase()
    .from("templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[supabase/templates] Delete error:", error);
    return false;
  }
  return true;
}

// ── Upload image to Supabase Storage ──
export async function uploadTemplateImage(
  filename: string,
  imageBase64: string,
  mimeType: string
): Promise<string | null> {
  const buffer = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

  const { error } = await supabase()
    .storage
    .from("templates")
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error("[supabase/templates] Upload error:", error);
    return null;
  }

  // Return public URL
  const { data } = supabase()
    .storage
    .from("templates")
    .getPublicUrl(filename);

  return data.publicUrl;
}

// ── Get image from Supabase Storage as base64 ──
export async function getTemplateImageFromStorage(
  filename: string
): Promise<{ imageBase64: string; mimeType: string } | null> {
  const { data, error } = await supabase()
    .storage
    .from("templates")
    .download(filename);

  if (error || !data) {
    console.error("[supabase/templates] Download error:", error);
    return null;
  }

  const buffer = await data.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = data.type || "image/png";

  return { imageBase64: base64, mimeType };
}

// ── Batch insert templates (for seeding) ──
export async function seedTemplatesToDb(
  templates: Array<{
    id: string;
    name: string;
    format: "square" | "story";
    category: string;
    filename: string;
    mimeType: string;
    tags?: { industry: string[]; adType: string[]; productType: string[] };
  }>
): Promise<number> {
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

  const { data, error } = await supabase()
    .from("templates")
    .upsert(rows, { onConflict: "id" })
    .select();

  if (error) {
    console.error("[supabase/templates] Seed error:", error);
    return 0;
  }
  return data?.length || 0;
}
