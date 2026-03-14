"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";
import AdPreviewCard from "@/components/ad-preview-card";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertCircle,
  LayoutGrid,
  Pencil,
  Check,
  Smartphone,
} from "lucide-react";

interface TemplateMeta {
  id: string;
  name: string;
  format: "square" | "story";
  category: string;
  previewUrl: string;
}

type Mode = "library" | "custom";

export default function GeneratePage() {
  const router = useRouter();
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const uploadedImages = useWizardStore((s) => s.uploadedImages);
  const generatedAds = useWizardStore((s) => s.generatedAds);
  const addGeneratedAd = useWizardStore((s) => s.addGeneratedAd);
  const updateGeneratedAd = useWizardStore((s) => s.updateGeneratedAd);
  const clearAds = useWizardStore((s) => s.clearAds);

  // Mode
  const [mode, setMode] = useState<Mode>("library");

  // Config
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedOffer, setSelectedOffer] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  // Library mode
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Custom mode
  const [customPrompt, setCustomPrompt] = useState("");
  const [customCount, setCustomCount] = useState(2);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [failedCount, setFailedCount] = useState(0);
  const [error, setError] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
        }
      } catch {
        // Silent
      }
      setLoadingTemplates(false);
    }
    loadTemplates();
  }, []);

  // Init selections
  useEffect(() => {
    if (!brandAnalysis) {
      router.push("/dashboard/analyze");
      return;
    }
    if (brandAnalysis.products.length > 0 && !selectedProduct) {
      setSelectedProduct(brandAnalysis.products[0].id);
    }
    if (brandAnalysis.offers.length > 0 && !selectedOffer) {
      setSelectedOffer(brandAnalysis.offers[0].id);
    }
    if (uploadedImages.length > 0 && !selectedImage) {
      setSelectedImage(uploadedImages[0].id);
    }
  }, [brandAnalysis, uploadedImages, router, selectedProduct, selectedOffer, selectedImage]);

  if (!brandAnalysis) return null;

  // Helpers
  function getSelections() {
    return {
      product: brandAnalysis!.products.find((p) => p.id === selectedProduct) || brandAnalysis!.products[0],
      offer: brandAnalysis!.offers.find((o) => o.id === selectedOffer) || null,
      image: uploadedImages.find((i) => i.id === selectedImage) || uploadedImages[0],
    };
  }

  function toggleTemplate(id: string) {
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function selectAllTemplates() {
    const squareTemplates = templates.filter((t) => t.format === "square");
    if (selectedTemplates.length === squareTemplates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(squareTemplates.map((t) => t.id));
    }
  }

  // ── Generate ──
  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setFailedCount(0);

    const { product, offer, image } = getSelections();

    if (mode === "library") {
      // Library mode: generate one ad per selected template
      if (selectedTemplates.length === 0) {
        setError("Sélectionne au moins un template.");
        setGenerating(false);
        return;
      }

      const total = selectedTemplates.length;
      setProgress({ current: 0, total });
      let current = 0;
      let failed = 0;

      for (const templateId of selectedTemplates) {
        try {
          const res = await fetch("/api/generate-ad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              brandAnalysis,
              product,
              offer,
              productImageBase64: image?.base64,
              productImageMimeType: image?.mimeType,
              format: "square",
              templateId,
            }),
          });

          if (!res.ok) {
            failed++;
            setFailedCount(failed);
          } else {
            const ad = await res.json();
            addGeneratedAd(ad);
          }
        } catch {
          failed++;
          setFailedCount(failed);
        }
        current++;
        setProgress({ current, total });
      }

      if (failed > 0 && failed < total) {
        setError(`${total - failed}/${total} ads générées`);
      } else if (failed === total) {
        setError("Toutes les générations ont échoué. Réessaie.");
      }
    } else {
      // Custom mode: generate N ads with the same custom prompt
      if (!customPrompt.trim()) {
        setError("Écris une description pour ton ad.");
        setGenerating(false);
        return;
      }

      const total = customCount;
      setProgress({ current: 0, total });
      let current = 0;
      let failed = 0;

      for (let i = 0; i < total; i++) {
        try {
          const res = await fetch("/api/generate-ad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              brandAnalysis,
              product,
              offer,
              productImageBase64: image?.base64,
              productImageMimeType: image?.mimeType,
              format: "square",
              customPrompt: customPrompt.trim(),
            }),
          });

          if (!res.ok) {
            failed++;
            setFailedCount(failed);
          } else {
            const ad = await res.json();
            addGeneratedAd(ad);
          }
        } catch {
          failed++;
          setFailedCount(failed);
        }
        current++;
        setProgress({ current, total });
      }

      if (failed > 0 && failed < total) {
        setError(`${total - failed}/${total} ads générées`);
      } else if (failed === total) {
        setError("Toutes les générations ont échoué. Réessaie.");
      }
    }

    setGenerating(false);
  }

  async function handleConvertToStory(ad: typeof generatedAds[0]) {
    setConvertingId(ad.id);
    const { product, offer, image } = getSelections();

    try {
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandAnalysis,
          product,
          offer,
          productImageBase64: image?.base64,
          productImageMimeType: image?.mimeType,
          format: "story",
          // Use same template or custom prompt as original
          templateId: ad.templateId || undefined,
          customPrompt: ad.templateId ? undefined : "Adapt this ad concept for a vertical story format.",
        }),
      });

      if (res.ok) {
        const newAd = await res.json();
        addGeneratedAd(newAd);
      }
    } catch {
      // Silent fail
    }
    setConvertingId(null);
  }

  const squareTemplates = templates.filter((t) => t.format === "square");
  const canGenerate = mode === "library"
    ? selectedTemplates.length > 0 && !!selectedProduct
    : !!customPrompt.trim() && !!selectedProduct;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Générez vos publicités
        </h1>
      </div>

      {/* Config bar */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Product */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Produit
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {brandAnalysis.products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Offer */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Offre
            </label>
            <select
              value={selectedOffer}
              onChange={(e) => setSelectedOffer(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Sans offre</option>
              {brandAnalysis.offers.map((o) => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </select>
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Image produit
            </label>
            <div className="flex gap-1.5">
              {uploadedImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.id)}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                    selectedImage === img.id
                      ? "border-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("library")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            mode === "library"
              ? "bg-primary text-white shadow-md"
              : "bg-white border border-border text-muted hover:bg-gray-50"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Bibliothèque
        </button>
        <button
          onClick={() => setMode("custom")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            mode === "custom"
              ? "bg-primary text-white shadow-md"
              : "bg-white border border-border text-muted hover:bg-gray-50"
          }`}
        >
          <Pencil className="w-4 h-4" />
          Personnalisé
        </button>
      </div>

      {/* Mode content */}
      {mode === "library" ? (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Choisis tes templates</h2>
              <p className="text-xs text-muted mt-0.5">
                L&apos;IA réplique le style de chaque template sélectionné pour ton produit.
              </p>
            </div>
            <button
              onClick={selectAllTemplates}
              className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
            >
              {selectedTemplates.length === squareTemplates.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          </div>

          {loadingTemplates ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : squareTemplates.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Aucun template disponible.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {squareTemplates.map((tpl) => {
                const isSelected = selectedTemplates.includes(tpl.id);
                return (
                  <button
                    key={tpl.id}
                    onClick={() => toggleTemplate(tpl.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 scale-[0.97]"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <img
                      src={tpl.previewUrl}
                      alt={tpl.name}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !canGenerate}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress.current}/{progress.total}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Générer {selectedTemplates.length > 0 ? `${selectedTemplates.length} ad${selectedTemplates.length > 1 ? "s" : ""}` : ""}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Décris ton ad</h2>
            <p className="text-xs text-muted mt-0.5">
              Écris exactement ce que tu veux voir. L&apos;IA génère l&apos;image à partir de ta description.
            </p>
          </div>

          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ex: Le produit posé sur une table en marbre blanc avec un fond rose doux, ambiance luxe et minimaliste. Une femme tient le produit dans ses mains."
            rows={4}
            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted/50 resize-none"
          />

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-foreground mb-1">
                Nombre de variations
              </label>
              <select
                value={customCount}
                onChange={(e) => setCustomCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n} variation{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !canGenerate}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progress.current}/{progress.total}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      {/* Gallery */}
      {generatedAds.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              {generatedAds.length} publicité{generatedAds.length > 1 ? "s" : ""} générée{generatedAds.length > 1 ? "s" : ""}
            </p>
            <button
              onClick={() => clearAds()}
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              Tout effacer
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedAds.map((ad) => (
              <AdPreviewCard
                key={ad.id}
                ad={ad}
                onUpdateAd={(id, updates) => updateGeneratedAd(id, updates)}
                isConvertingToStory={convertingId === ad.id}
                onConvertToStory={
                  ad.format === "square"
                    ? () => handleConvertToStory(ad)
                    : undefined
                }
                onRegenerate={async () => {
                  const { product, offer, image } = getSelections();

                  try {
                    const res = await fetch("/api/generate-ad", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        brandAnalysis,
                        product,
                        offer,
                        productImageBase64: image?.base64,
                        productImageMimeType: image?.mimeType,
                        format: ad.format,
                        templateId: ad.templateId || undefined,
                        customPrompt: ad.templateId ? undefined : customPrompt.trim() || undefined,
                      }),
                    });

                    if (res.ok) {
                      const newAd = await res.json();
                      addGeneratedAd(newAd);
                    }
                  } catch {
                    // Silent fail
                  }
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="w-10 h-10 text-border mb-3" />
          <p className="text-sm text-muted max-w-sm">
            {mode === "library"
              ? "Sélectionnez des templates et cliquez sur Générer. L'IA réplique chaque style pour votre produit."
              : "Décrivez votre ad et cliquez sur Générer. L'IA crée l'image à partir de votre description."}
          </p>
        </div>
      )}

      <button
        onClick={() => router.push("/dashboard/images")}
        className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux images
      </button>
    </div>
  );
}
