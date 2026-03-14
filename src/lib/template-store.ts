// Server-side template storage using local files
// Metadata: src/data/templates.json
// Images: public/templates/<id>.png|jpg|webp
//
// Works in dev (read + write) and production (read-only, files committed to git)

import fs from "fs";
import path from "path";

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

export interface TemplateMeta {
  id: string;
  name: string;
  format: "square" | "story";
  category: string;
  filename: string;
  mimeType: string;
}

const DATA_FILE = path.join(process.cwd(), "src/data/templates.json");
const IMAGES_DIR = path.join(process.cwd(), "public/templates");

// ── Read metadata ──
function readMeta(): TemplateMeta[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ── Write metadata ──
function writeMeta(templates: TemplateMeta[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(templates, null, 2));
}

// ── Public: get all templates (for listing) ──
export function getTemplates(): (TemplateMeta & { previewUrl: string })[] {
  return readMeta().map((t) => ({
    ...t,
    previewUrl: `/templates/${t.filename}`,
  }));
}

// ── Public: get random template with base64 image for Gemini ──
export function getRandomTemplateWithImage(
  format: "square" | "story"
): { id: string; imageBase64: string; mimeType: string } | null {
  const matching = readMeta().filter((t) => t.format === format);
  if (matching.length === 0) return null;

  const template = matching[Math.floor(Math.random() * matching.length)];
  const imagePath = path.join(IMAGES_DIR, template.filename);

  try {
    const buffer = fs.readFileSync(imagePath);
    return {
      id: template.id,
      imageBase64: buffer.toString("base64"),
      mimeType: template.mimeType,
    };
  } catch {
    console.error(`Template image not found: ${imagePath}`);
    return null;
  }
}

// ── Public: get a specific template by ID with base64 image ──
export function getTemplateByIdWithImage(
  id: string
): { id: string; imageBase64: string; mimeType: string } | null {
  const templates = readMeta();
  const template = templates.find((t) => t.id === id);
  if (!template) return null;

  const imagePath = path.join(IMAGES_DIR, template.filename);

  try {
    const buffer = fs.readFileSync(imagePath);
    return {
      id: template.id,
      imageBase64: buffer.toString("base64"),
      mimeType: template.mimeType,
    };
  } catch {
    console.error(`Template image not found: ${imagePath}`);
    return null;
  }
}

// ── Public: add a new template (dev mode only) ──
export function addTemplate(
  name: string,
  format: "square" | "story",
  category: string,
  imageBase64: string,
  mimeType: string
): TemplateMeta & { previewUrl: string } {
  const id = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const ext = mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
      ? "webp"
      : "jpg";
  const filename = `${id}.${ext}`;

  // Write image file
  const buffer = Buffer.from(imageBase64, "base64");
  fs.writeFileSync(path.join(IMAGES_DIR, filename), buffer);

  // Update metadata
  const templates = readMeta();
  const newTemplate: TemplateMeta = {
    id,
    name,
    format,
    category,
    filename,
    mimeType,
  };
  templates.push(newTemplate);
  writeMeta(templates);

  return { ...newTemplate, previewUrl: `/templates/${filename}` };
}

// ── Public: remove a template ──
export function removeTemplate(id: string): boolean {
  const templates = readMeta();
  const template = templates.find((t) => t.id === id);
  if (!template) return false;

  // Delete image file
  const imagePath = path.join(IMAGES_DIR, template.filename);
  try {
    fs.unlinkSync(imagePath);
  } catch {
    // File might not exist
  }

  // Update metadata
  writeMeta(templates.filter((t) => t.id !== id));
  return true;
}

// ── Public: update template metadata ──
export function updateTemplate(
  id: string,
  partial: { name?: string; format?: string; category?: string }
): boolean {
  const templates = readMeta();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return false;

  templates[idx] = { ...templates[idx], ...partial } as TemplateMeta;
  writeMeta(templates);
  return true;
}
