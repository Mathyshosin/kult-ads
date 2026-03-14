"use client";

import { useState, useEffect, useCallback } from "react";
import ImageUploadZone from "@/components/image-upload-zone";
import TemplateCard from "@/components/template-card";
import type { AdTemplate } from "@/lib/types";
import { Loader2, LayoutGrid, AlertCircle } from "lucide-react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<AdTemplate[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterFormat, setFilterFormat] = useState<"all" | "square" | "story">(
    "all"
  );

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      setError("Impossible de charger les templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  async function handleUpload(files: File[]) {
    setUploading(true);
    setError("");
    try {
      const supabase = createSupabaseClient();

      for (const file of files) {
        // Auto-detect format from image dimensions
        const format = await new Promise<"square" | "story">((resolve) => {
          const tempImg = new window.Image();
          tempImg.onload = () => {
            resolve(tempImg.height > tempImg.width * 1.3 ? "story" : "square");
          };
          tempImg.onerror = () => resolve("square");
          tempImg.src = URL.createObjectURL(file);
        });

        // Generate unique filename
        const id = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
        const filename = `${id}.${ext}`;

        // Upload directly to Supabase Storage (bypasses Vercel 4.5MB limit)
        const { error: uploadErr } = await supabase.storage
          .from("templates")
          .upload(filename, file, { contentType: file.type, upsert: true });

        if (uploadErr) throw new Error(`Upload échoué: ${uploadErr.message}`);

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from("templates")
          .getPublicUrl(filename);

        // Save metadata to DB via API (small JSON, no image)
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add-metadata",
            id,
            name: file.name.replace(/\.[^.]+$/, ""),
            format,
            category: "promo",
            filename,
            mimeType: file.type,
            imageSource: "supabase",
            previewUrl: urlData.publicUrl,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erreur sauvegarde");
        }
      }

      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(id: string) {
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", id }),
    });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleUpdate(id: string, partial: Partial<AdTemplate>) {
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, ...partial }),
    });
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...partial } : t))
    );
  }

  const filteredTemplates =
    filterFormat === "all"
      ? templates
      : templates.filter((t) => t.format === filterFormat);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-3">
          🔒 Admin uniquement
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Bibliothèque de templates
        </h1>
        <p className="mt-2 text-muted max-w-lg mx-auto">
          Uploadez vos ads qui marchent. Le système les sélectionnera
          automatiquement pour reproduire le style avec les produits des clients.
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
                onRemove={() => handleRemove(tpl.id)}
                onUpdate={(partial) => handleUpdate(tpl.id, partial)}
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
