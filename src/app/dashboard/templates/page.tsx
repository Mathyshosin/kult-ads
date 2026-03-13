"use client";

import { useState } from "react";
import { useTemplateStore } from "@/lib/store";
import ImageUploadZone from "@/components/image-upload-zone";
import TemplateCard from "@/components/template-card";
import { Loader2, LayoutGrid, AlertCircle } from "lucide-react";

export default function TemplatesPage() {
  const templates = useTemplateStore((s) => s.templates);
  const addTemplate = useTemplateStore((s) => s.addTemplate);
  const removeTemplate = useTemplateStore((s) => s.removeTemplate);
  const updateTemplate = useTemplateStore((s) => s.updateTemplate);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [filterFormat, setFilterFormat] = useState<"all" | "square" | "story">("all");

  async function handleUpload(files: File[]) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const { images } = await res.json();
      for (const img of images) {
        // Auto-detect format from aspect ratio
        const tempImg = new Image();
        const format = await new Promise<"square" | "story">((resolve) => {
          tempImg.onload = () => {
            resolve(tempImg.height > tempImg.width * 1.3 ? "story" : "square");
          };
          tempImg.onerror = () => resolve("square");
          tempImg.src = img.dataUrl;
        });

        addTemplate({
          id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: img.name.replace(/\.[^.]+$/, ""),
          format,
          category: "promo",
          imageBase64: img.base64,
          mimeType: img.mimeType,
          previewUrl: img.dataUrl,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  const filteredTemplates =
    filterFormat === "all"
      ? templates
      : templates.filter((t) => t.format === filterFormat);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Bibliothèque de templates
        </h1>
        <p className="mt-2 text-muted">
          Uploadez vos ads qui marchent. L&apos;IA les reproduira avec les infos
          de chaque client.
        </p>
      </div>

      {/* Upload zone */}
      <div className="max-w-lg mx-auto">
        <ImageUploadZone onFilesSelected={handleUpload} disabled={uploading} />
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted mt-3 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Upload en cours...
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Filter + grid */}
      {templates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
              {filteredTemplates.length} template
              {filteredTemplates.length > 1 ? "s" : ""}
            </h2>
            <div className="flex gap-1">
              {(["all", "square", "story"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterFormat(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterFormat === f
                      ? "bg-primary text-white"
                      : "bg-surface border border-border text-foreground hover:bg-gray-100"
                  }`}
                >
                  {f === "all" ? "Tous" : f === "square" ? "Carré" : "Story"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                editable
                onRemove={() => removeTemplate(tpl.id)}
                onUpdate={(partial) => updateTemplate(tpl.id, partial)}
              />
            ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="text-center py-12">
          <LayoutGrid className="w-12 h-12 text-border mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">
            Aucun template
          </h3>
          <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
            Uploadez vos meilleures publicités pour que l&apos;IA puisse les
            reproduire avec les produits de vos clients.
          </p>
        </div>
      )}
    </div>
  );
}
