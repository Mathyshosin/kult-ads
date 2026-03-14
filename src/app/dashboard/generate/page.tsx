"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import AdPreviewCard from "@/components/ad-preview-card";
import { AD_TYPE_TAGS } from "@/lib/template-tags";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertCircle,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function GeneratePage() {
  const router = useRouter();
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const uploadedImages = useWizardStore((s) => s.uploadedImages);
  const generatedAds = useWizardStore((s) => s.generatedAds);
  const addGeneratedAd = useWizardStore((s) => s.addGeneratedAd);
  const updateGeneratedAd = useWizardStore((s) => s.updateGeneratedAd);
  const clearAds = useWizardStore((s) => s.clearAds);
  const syncClearAds = useWizardStore((s) => s.syncClearAds);
  const brandLogo = useWizardStore((s) => s.brandLogo);
  const syncGeneratedAd = useWizardStore((s) => s.syncGeneratedAd);
  const currentUser = useAuthStore((s) => s.currentUser);

  // Config
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedOffer, setSelectedOffer] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  // Ad style preference (optional)
  const [selectedAdStyle, setSelectedAdStyle] = useState("");

  // Custom prompt (collapsible)
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);

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

  // ── Generate ──
  async function handleGenerate() {
    if (showCustom && customPrompt.trim()) {
      // Custom prompt mode
      await handleGenerateCustom();
    } else {
      // Auto mode
      await handleGenerateAuto();
    }
  }

  async function handleGenerateAuto() {
    setGenerating(true);
    setError("");

    const { product, offer, image } = getSelections();

    try {
      // Step 1: Select best template via scoring API
      const selectRes = await fetch("/api/templates/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandAnalysis,
          offer,
          format: "square",
          count: 1,
          adStyle: selectedAdStyle || undefined,
        }),
      });

      if (!selectRes.ok) {
        setError("Impossible de sélectionner un template.");
        setGenerating(false);
        return;
      }

      const { templateIds } = await selectRes.json();

      if (!templateIds || templateIds.length === 0) {
        setError("Aucun template disponible.");
        setGenerating(false);
        return;
      }

      // Step 2: Generate 1 ad
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandAnalysis,
          product,
          offer,
          productImageBase64: image?.base64,
          productImageMimeType: image?.mimeType,
          brandLogoBase64: brandLogo?.base64,
          brandLogoMimeType: brandLogo?.mimeType,
          format: "square",
          templateId: templateIds[0],
        }),
      });

      if (!res.ok) {
        setError("La génération a échoué. Réessaie.");
      } else {
        const ad = await res.json();
        addGeneratedAd(ad);
        if (currentUser) syncGeneratedAd(currentUser.id, ad);
      }
    } catch {
      setError("Erreur lors de la génération.");
    }

    setGenerating(false);
  }

  async function handleGenerateCustom() {
    setGenerating(true);
    setError("");

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
          brandLogoBase64: brandLogo?.base64,
          brandLogoMimeType: brandLogo?.mimeType,
          format: "square",
          customPrompt: customPrompt.trim(),
        }),
      });

      if (!res.ok) {
        setError("La génération a échoué. Réessaie.");
      } else {
        const ad = await res.json();
        addGeneratedAd(ad);
        if (currentUser) syncGeneratedAd(currentUser.id, ad);
      }
    } catch {
      setError("La génération a échoué. Réessaie.");
    }

    setGenerating(false);
  }

  async function handleConvertToStory(ad: typeof generatedAds[0]) {
    setConvertingId(ad.id);

    try {
      const res = await fetch("/api/convert-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: ad.imageBase64,
          mimeType: ad.mimeType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const storyAd = {
          ...ad,
          id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          format: "story" as const,
          imageBase64: data.imageBase64,
          mimeType: data.mimeType,
          timestamp: Date.now(),
        };
        addGeneratedAd(storyAd);
        if (currentUser) syncGeneratedAd(currentUser.id, storyAd);
      }
    } catch {
      // Silent fail
    }
    setConvertingId(null);
  }

  const canGenerate = !!selectedProduct && (!showCustom || !!customPrompt.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Générez vos publicités
        </h1>
        <p className="text-sm text-muted mt-1">
          L&apos;IA sélectionne le meilleur template et crée une ad adaptée à ta marque.
        </p>
      </div>

      {/* Config card */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-5">
        {/* Product + Offer + Image */}
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
                <option key={o.id} value={o.id}>
                  {o.title}{o.salePrice ? ` — ${o.salePrice}` : o.discountValue ? ` (${o.discountValue})` : ""}
                </option>
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

        {/* Ad style selector */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-2">
            Style d&apos;ad <span className="text-muted font-normal">(optionnel)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedAdStyle("")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedAdStyle === ""
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              Auto
            </button>
            {AD_TYPE_TAGS.map((tag) => (
              <button
                key={tag.value}
                onClick={() => setSelectedAdStyle(selectedAdStyle === tag.value ? "" : tag.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedAdStyle === tag.value
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom prompt (collapsible) */}
        <div>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
          >
            {showCustom ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Prompt personnalisé
          </button>
          {showCustom && (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ex: Le produit posé sur une table en marbre blanc avec un fond rose doux, ambiance luxe et minimaliste."
              rows={3}
              className="w-full mt-2 px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted/50 resize-none"
            />
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !canGenerate}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Générer une ad
            </>
          )}
        </button>
      </div>

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
              onClick={() => {
                clearAds();
                if (currentUser) syncClearAds(currentUser.id);
              }}
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
                        brandLogoBase64: brandLogo?.base64,
                        brandLogoMimeType: brandLogo?.mimeType,
                        format: ad.format,
                        templateId: ad.templateId || undefined,
                        customPrompt: customPrompt.trim() || undefined,
                      }),
                    });

                    if (res.ok) {
                      const newAd = await res.json();
                      addGeneratedAd(newAd);
                      if (currentUser) syncGeneratedAd(currentUser.id, newAd);
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
            Configure ton produit et clique sur Générer. L&apos;IA sélectionne automatiquement le meilleur template.
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
