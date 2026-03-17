import { createClient } from "./server";

export interface PendingTemplateRow {
  id: string;
  filename: string;
  mime_type: string;
  format: "square" | "story";
  status: "pending" | "approved" | "rejected";
  submitted_by: string;
  created_at: string;
}

// ── Save pending template metadata ──
export async function savePendingTemplate(
  id: string,
  filename: string,
  mimeType: string,
  format: string,
  submittedBy: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("pending_templates").insert({
    id,
    filename,
    mime_type: mimeType,
    format,
    status: "pending",
    submitted_by: submittedBy,
  });
  if (error) console.error("[pending-templates] Insert error:", error);
}

// ── Upload image to pending-templates bucket ──
export async function uploadPendingImage(
  filename: string,
  imageBase64: string,
  mimeType: string
): Promise<void> {
  const supabase = await createClient();
  const buffer = Buffer.from(imageBase64, "base64");
  const { error } = await supabase.storage
    .from("pending-templates")
    .upload(filename, buffer, { contentType: mimeType, upsert: true });
  if (error) console.error("[pending-templates] Upload error:", error);
}

// ── List pending templates with public URLs ──
export async function getPendingTemplates(): Promise<
  (PendingTemplateRow & { imageUrl: string })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pending_templates")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[pending-templates] List error:", error);
    return [];
  }

  return (data as PendingTemplateRow[]).map((row) => {
    const { data: urlData } = supabase.storage
      .from("pending-templates")
      .getPublicUrl(row.filename);
    return { ...row, imageUrl: urlData.publicUrl };
  });
}

// ── Update status ──
export async function updatePendingStatus(
  id: string,
  status: "approved" | "rejected"
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pending_templates")
    .update({ status })
    .eq("id", id);
  if (error) console.error("[pending-templates] Update error:", error);
}

// ── Download image as base64 (for approval flow) ──
export async function getPendingImageBase64(
  filename: string
): Promise<{ imageBase64: string; mimeType: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("pending-templates")
    .download(filename);

  if (error || !data) {
    console.error("[pending-templates] Download error:", error);
    return null;
  }

  const buffer = await data.arrayBuffer();
  return {
    imageBase64: Buffer.from(buffer).toString("base64"),
    mimeType: data.type || "image/jpeg",
  };
}

// ── Delete image from bucket ──
export async function deletePendingImage(filename: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("pending-templates")
    .remove([filename]);
  if (error) console.error("[pending-templates] Delete error:", error);
}
