// Template storage backed by Supabase (DB + Storage)
// Metadata: Supabase `templates` table
// Images: public/templates/<filename> (existing) or Supabase Storage (new uploads)

import fs from "fs";
import path from "path";
import {
  getTemplatesFromDb,
  getTemplateFromDb,
  addTemplateToDb,
  removeTemplateFromDb,
  updateTemplateInDb,
  uploadTemplateImage,
  getTemplateImageFromStorage,
} from "@/lib/supabase/templates";

// Pre-computed template analysis (fixed fields that don't change per brand)
export interface TemplateAnalysisData {
  isTextOnly: boolean;
  templateType: "product-showcase" | "comparison" | "text-only" | "lifestyle";
  templateHasPrices: boolean;
  templateTextCount: number;
  templateHasHumanModel: boolean;
  templateHasProductPhoto: boolean;
  textElements: string[];  // e.g. ["headline", "percentage", "brand-name", "date"]
  layout: {
    textPosition: string;
    productPosition: string;
    ctaPosition: string;
    ctaStyle: string;
    backgroundStyle: string;
    typographyStyle: string;
    brandLogoPosition: string;
    decorativeElements: string;
    comparisonLayout?: string;
    headlineStyle: string;
    subheadlineStyle?: string;
    textColor: string;
    accentColor?: string;
    productSizePercent?: string;
    textAreaPercent?: string;
    margins?: string;
  };
}

export interface TemplateTags {
  industry: string[];
  adType: string[];
  productType: string[];
}

export interface TemplateMeta {
  id: string;
  name: string;
  format: "square" | "story";
  category: string;
  filename: string;
  mimeType: string;
  tags?: TemplateTags;
}

const IMAGES_DIR = path.join(process.cwd(), "public/templates");

// ── Read local image file as base64 ──
function readLocalImage(filename: string): { imageBase64: string; mimeType: string } | null {
  const imagePath = path.join(IMAGES_DIR, filename);
  try {
    const buffer = fs.readFileSync(imagePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return { imageBase64: buffer.toString("base64"), mimeType };
  } catch {
    return null;
  }
}

// ── Public: get all templates (for listing) ──
export async function getTemplates(): Promise<(TemplateMeta & { previewUrl: string })[]> {
  const rows = await getTemplatesFromDb();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    format: r.format,
    category: r.category,
    filename: r.filename,
    mimeType: r.mime_type,
    tags: r.tags,
    previewUrl: r.image_source === "local"
      ? `/templates/${r.filename}`
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/templates/${r.filename}`,
  }));
}

// ── Public: get a specific template by ID with base64 image ──
export async function getTemplateByIdWithImage(
  id: string
): Promise<{ id: string; imageBase64: string; mimeType: string } | null> {
  const row = await getTemplateFromDb(id);
  if (!row) return null;

  if (row.image_source === "local") {
    const img = readLocalImage(row.filename);
    if (!img) return null;
    return { id: row.id, imageBase64: img.imageBase64, mimeType: img.mimeType };
  }

  // Supabase Storage
  const img = await getTemplateImageFromStorage(row.filename);
  if (!img) return null;
  return { id: row.id, imageBase64: img.imageBase64, mimeType: img.mimeType };
}

// ── Public: get random template with base64 image ──
export async function getRandomTemplateWithImage(
  format: "square" | "story"
): Promise<{ id: string; imageBase64: string; mimeType: string } | null> {
  const rows = await getTemplatesFromDb();
  const matching = rows.filter((r) => r.format === format);
  if (matching.length === 0) return null;

  const row = matching[Math.floor(Math.random() * matching.length)];

  if (row.image_source === "local") {
    const img = readLocalImage(row.filename);
    if (!img) return null;
    return { id: row.id, imageBase64: img.imageBase64, mimeType: img.mimeType };
  }

  const img = await getTemplateImageFromStorage(row.filename);
  if (!img) return null;
  return { id: row.id, imageBase64: img.imageBase64, mimeType: img.mimeType };
}

// ── Public: add a new template ──
export async function addTemplate(
  name: string,
  format: "square" | "story",
  category: string,
  imageBase64: string,
  mimeType: string
): Promise<(TemplateMeta & { previewUrl: string }) | null> {
  const id = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const ext = mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
      ? "webp"
      : "jpg";
  const filename = `${id}.${ext}`;

  // Upload image to Supabase Storage
  const publicUrl = await uploadTemplateImage(filename, imageBase64, mimeType);
  if (!publicUrl) return null;

  // Insert metadata into Supabase DB
  const row = await addTemplateToDb({
    id,
    name,
    format,
    category,
    filename,
    mimeType,
    imageSource: "supabase",
  });

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    format: row.format,
    category: row.category,
    filename: row.filename,
    mimeType: row.mime_type,
    tags: row.tags,
    previewUrl: publicUrl,
  };
}

// ── Public: remove a template ──
export async function removeTemplate(id: string): Promise<boolean> {
  return removeTemplateFromDb(id);
}

// ── Public: update template metadata ──
export async function updateTemplate(
  id: string,
  partial: { name?: string; format?: string; category?: string; tags?: TemplateTags }
): Promise<boolean> {
  return updateTemplateInDb(id, partial);
}
