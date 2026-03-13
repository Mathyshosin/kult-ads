// Server-side template operations using Supabase
// Table: templates (id, name, format, category, image_path, mime_type, created_at)
// Storage bucket: templates (stores the actual image files)

import { supabase } from "./supabase";
import type { AdTemplate } from "./types";

const BUCKET = "templates";

// ── Fetch all templates ──
export async function getTemplates(): Promise<AdTemplate[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching templates:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    format: row.format,
    category: row.category,
    imageBase64: "", // Not loaded in listing
    mimeType: row.mime_type,
    previewUrl: getPublicUrl(row.image_path),
  }));
}

// ── Get templates by format ──
export async function getTemplatesByFormat(
  format: "square" | "story"
): Promise<AdTemplate[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("format", format);

  if (error) {
    console.error("Error fetching templates by format:", error);
    return [];
  }

  return data || [];
}

// ── Get a random template with its image data for generation ──
export async function getRandomTemplateWithImage(
  format: "square" | "story"
): Promise<{ imageBase64: string; mimeType: string } | null> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("format", format);

  if (error || !data || data.length === 0) return null;

  // Pick random
  const row = data[Math.floor(Math.random() * data.length)];

  // Download the image from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(row.image_path);

  if (downloadError || !fileData) {
    console.error("Error downloading template image:", downloadError);
    return null;
  }

  // Convert blob to base64
  const buffer = Buffer.from(await fileData.arrayBuffer());
  const imageBase64 = buffer.toString("base64");

  return {
    imageBase64,
    mimeType: row.mime_type,
  };
}

// ── Add a new template ──
export async function addTemplate(
  name: string,
  format: "square" | "story",
  category: string,
  imageBase64: string,
  mimeType: string
): Promise<AdTemplate | null> {
  const id = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const imagePath = `${id}.${ext}`;

  // Upload image to storage
  const buffer = Buffer.from(imageBase64, "base64");
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(imagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Error uploading template image:", uploadError);
    return null;
  }

  // Insert metadata row
  const { error: insertError } = await supabase.from("templates").insert({
    id,
    name,
    format,
    category,
    image_path: imagePath,
    mime_type: mimeType,
  });

  if (insertError) {
    console.error("Error inserting template:", insertError);
    // Cleanup uploaded file
    await supabase.storage.from(BUCKET).remove([imagePath]);
    return null;
  }

  return {
    id,
    name,
    format,
    category,
    imageBase64: "",
    mimeType,
    previewUrl: getPublicUrl(imagePath),
  };
}

// ── Remove a template ──
export async function removeTemplate(id: string): Promise<boolean> {
  // Get image path first
  const { data } = await supabase
    .from("templates")
    .select("image_path")
    .eq("id", id)
    .single();

  if (data?.image_path) {
    await supabase.storage.from(BUCKET).remove([data.image_path]);
  }

  const { error } = await supabase.from("templates").delete().eq("id", id);

  if (error) {
    console.error("Error removing template:", error);
    return false;
  }

  return true;
}

// ── Update template metadata ──
export async function updateTemplate(
  id: string,
  partial: { name?: string; format?: string; category?: string }
): Promise<boolean> {
  const { error } = await supabase
    .from("templates")
    .update(partial)
    .eq("id", id);

  if (error) {
    console.error("Error updating template:", error);
    return false;
  }

  return true;
}

// ── Helper: get public URL for an image ──
function getPublicUrl(imagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(imagePath);
  return data.publicUrl;
}
