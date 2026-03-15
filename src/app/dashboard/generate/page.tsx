"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import type { GeneratedAd } from "@/lib/types";
import AdPreviewCard from "@/components/ad-preview-card";
import GrowthTips from "@/components/growth-tips";
import ImageUploadZone from "@/components/image-upload-zone";
import {
  Loader2,
  Sparkles,
  AlertCircle,
  Zap,
  Shuffle,
  Pencil,
  ImageIcon,
  Download,
  Smartphone,
  RefreshCw,
  ChevronDown,
  X,
} from "lucide-react";

export default function GeneratePage() {
  const router = useRouter();
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const uploadedImages = useWizardStore((s) => s.uploadedImages);
  const generatedAds = useWizardStore((s) => s.generatedAds);
  const addGeneratedAd = useWizardStore((s) => s.addGeneratedAd);
  const updateGeneratedAd = useWizardStore((s) => s.updateGeneratedAd);
  const brandLogo = useWizardStore((s) => s.brandLogo);
  const generationMode = useWizardStore((s) => s.generationMode);
  const setGenerationMode = useWizardStore((s) => s.setGenerationMode);
  const selectedFormat = useWizardStore((s) => s.selectedFormat);
  const setSelectedFormat = useWizardStore((s) => s.setSelectedFormat);
  const referenceAd = useWizardStore((s) => s.referenceAd);
  const setReferenceAd = useWizardStore((s) => s.setReferenceAd);
  const syncGeneratedAd = useWizardStore((s) => s.syncGeneratedAd);
  const currentUser = useAuthStore((s) => s.currentUser);

  // Config
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedOffer, setSelectedOffer] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedProductType, setSelectedProductType] = useState<
    "produit" | "service"
  >("produit");
  const [customPrompt, setCustomPrompt] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Right panel
  const [showModification, setShowModification] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState("");

  // Init selections
  useEffect(() => {
    if (!brandAnalysis) {
      router.push("/dashboard/brand");
      return;
    }
    if (brandAnalysis.products.length > 0 && !selectedProduct) {
      setSelectedProduct(brandAnalysis.products[0].id);
    }
    if (uploadedImages.length > 0 && !selectedImage) {
      setSelectedImage(uploadedImages[0].id);
    }
  }, [brandAnalysis, uploadedImages, router, selectedProduct, selectedImage]);

  // Helpers
  const getSelections = useCallback(() => {
    return {
      product:
        brandAnalysis?.products.find((p) => p.id === selectedProduct) ||
        brandAnalysis?.products[0],
      offer:
        brandAnalysis?.offers.find((o) => o.id === selectedOffer) || null,
      image:
        uploadedImages.find((i) => i.id === selectedImage) ||
        uploadedImages[0],
    };
  }, [brandAnalysis, selectedProduct, selectedOffer, selectedImage, uploadedImages]);

  // Reference ad upload handler
  const handleReferenceUpload = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        setReferenceAd({ base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    },
    [setReferenceAd]
  );

  // ── Generate ──
  async function handleGenerate() {
    setGenerating(true);
    setError("");

    const { product, offer, image } = getSelections();

    try {
      let templateId: string | undefined;

      // In auto mode, select a random template
      if (generationMode === "auto") {
        const selectRes = await fetch("/api/templates/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            format: selectedFormat,
            count: 1,
            productType: selectedProductType,
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
        templateId = templateIds[0];
      }

      const genBody = JSON.stringify({
        brandAnalysis,
        product,
        offer,
        productImageBase64: image?.base64,
        productImageMimeType: image?.mimeType,
        brandLogoBase64: brandLogo?.base64,
        brandLogoMimeType: brandLogo?.mimeType,
        format: selectedFormat,
        templateId,
        customPrompt:
          generationMode === "custom" ? customPrompt.trim() || undefined : undefined,
        referenceAdBase64:
          generationMode === "reference" ? referenceAd?.base64 : undefined,
        referenceAdMimeType:
          generationMode === "reference" ? referenceAd?.mimeType : undefined,
        referenceInstruction:
          generationMode === "reference" ? customPrompt.trim() || undefined : undefined,
      });

      let res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: genBody,
      });

      // Auto-retry once on failure
      if (!res.ok) {
        console.warn("[generate] First attempt failed, retrying...");
        await new Promise((r) => setTimeout(r, 2000));
        res = await fetch("/api/generate-ad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: genBody,
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.error || "La génération a échoué. Réessaie.");
      } else {
        const ad = await res.json();
        addGeneratedAd(ad);
        if (currentUser) syncGeneratedAd(currentUser.id, ad);
      }
    } catch (err) {
      console.error("[generate] Error:", err);
      setError("Erreur réseau. Vérifie ta connexion et réessaie.");
    }

    setGenerating(false);
  }

  // ── Convert to Story ──
  async function handleConvertToStory(ad: GeneratedAd) {
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
        const storyAd: GeneratedAd = {
          ...ad,
          id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          format: "story",
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

  // ── Regenerate ──
  async function handleRegenerate(ad: GeneratedAd) {
    setGenerating(true);
    setError("");

    const { product, offer, image } = getSelections();
    const genBody = JSON.stringify({
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
    });

    try {
      let res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: genBody,
      });

      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 2000));
        res = await fetch("/api/generate-ad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: genBody,
        });
      }

      if (res.ok) {
        const newAd = await res.json();
        addGeneratedAd(newAd);
        if (currentUser) syncGeneratedAd(currentUser.id, newAd);
      } else {
        const errData = await res.json().catch(() => null);
        setError(errData?.error || "La regénération a échoué.");
      }
    } catch {
      setError("Erreur réseau lors de la regénération.");
    }
    setGenerating(false);
  }

  // ── Download helper ──
  function handleDownloadAd(ad: GeneratedAd) {
    const link = document.createElement("a");
    link.href = `data:${ad.mimeType};base64,${ad.imageBase64}`;
    link.download = `kult-ad-${ad.format}-${Date.now()}.png`;
    link.click();
  }

  if (!brandAnalysis) {
    return (
      <div className="-mt-8 flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-border mx-auto" />
          <p className="text-sm text-muted">
            Configure d&apos;abord ta marque dans &quot;Ma Marque&quot;
          </p>
          <button
            onClick={() => router.push("/dashboard/brand")}
            className="text-sm text-primary font-medium hover:underline"
          >
            Aller à Ma Marque
          </button>
        </div>
      </div>
    );
  }

  const canGenerate =
    !!selectedProduct &&
    (generationMode !== "custom" || !!customPrompt.trim()) &&
    (generationMode !== "reference" || !!referenceAd);

  const latestAd =
    generatedAds.length > 0 ? generatedAds[generatedAds.length - 1] : null;
  const historyAds =
    generatedAds.length > 1 ? generatedAds.slice(0, -1).reverse() : [];

  const modificationChips = [
    "Changer le fond",
    "Supprimer le texte",
    "Ajouter un logo",
    "Modifier les couleurs",
  ];

  return (
    <div className="-mt-8 flex h-[calc(100vh-3.5rem)]">
      {/* ═══ LEFT PANEL ═══ */}
      <div className="w-[380px] flex-shrink-0 border-r border-border bg-white flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Product selector */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Produit
            </label>
            <div className="relative">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-8"
              >
                {brandAnalysis.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.price ? ` — ${p.price}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
            {/* Product thumbnail */}
            {uploadedImages.length > 0 && (
              <div className="flex gap-1.5 mt-2">
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
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Offer selector */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Offre
            </label>
            <div className="relative">
              <select
                value={selectedOffer}
                onChange={(e) => setSelectedOffer(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-8"
              >
                <option value="">Sans offre</option>
                {brandAnalysis.offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                    {o.salePrice
                      ? ` — ${o.salePrice}`
                      : o.discountValue
                        ? ` (${o.discountValue})`
                        : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
          </div>

          {/* Product type toggle */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Type de produit
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedProductType("produit")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedProductType === "produit"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                }`}
              >
                Produit
              </button>
              <button
                onClick={() => setSelectedProductType("service")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedProductType === "service"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                }`}
              >
                Service
              </button>
            </div>
          </div>

          {/* Format toggle */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Format
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFormat("square")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedFormat === "square"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                }`}
              >
                Carré
              </button>
              <button
                onClick={() => setSelectedFormat("story")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedFormat === "story"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                }`}
              >
                Story
              </button>
            </div>
          </div>

          {/* Generation mode tabs */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Mode de génération
            </label>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setGenerationMode("auto")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  generationMode === "auto"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                Auto
              </button>
              <button
                onClick={() => setGenerationMode("custom")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  generationMode === "custom"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                Prompt
              </button>
              <button
                onClick={() => setGenerationMode("reference")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  generationMode === "reference"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Référence
              </button>
            </div>

            {/* Mode content */}
            <div className="mt-3">
              {generationMode === "auto" && (
                <p className="text-xs text-muted bg-surface rounded-xl px-3 py-2.5">
                  Template aléatoire — l&apos;IA sélectionne le meilleur template
                  pour votre produit.
                </p>
              )}

              {generationMode === "custom" && (
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ex: Le produit posé sur une table en marbre blanc avec un fond rose doux, ambiance luxe et minimaliste."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted/50 resize-none"
                />
              )}

              {generationMode === "reference" && (
                <div className="space-y-3">
                  {referenceAd ? (
                    <div className="relative">
                      <img
                        src={`data:${referenceAd.mimeType};base64,${referenceAd.base64}`}
                        alt="Référence"
                        className="w-full rounded-xl border border-border"
                      />
                      <button
                        onClick={() => setReferenceAd(null)}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <ImageUploadZone onFilesSelected={handleReferenceUpload} />
                  )}
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Instructions optionnelles pour adapter la référence..."
                    rows={2}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted/50 resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">{error}</p>
            </div>
          )}
        </div>

        {/* Generate button — sticky at bottom */}
        <div className="sticky bottom-0 p-4 bg-white border-t border-border">
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
                Générer la publicité
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div className="flex-1 h-full overflow-y-auto bg-surface">
        {generating ? (
          /* State 2: Loading */
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Génération en cours...
              </p>
              <p className="text-xs text-muted">
                Cela prend généralement 30 à 60 secondes
              </p>
            </div>
            <GrowthTips />
          </div>
        ) : latestAd ? (
          /* State 3: Result */
          <div className="p-6 space-y-6">
            {/* Latest ad — prominent */}
            <div className="max-w-md mx-auto">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Dernière création
                </h2>
              </div>
              <AdPreviewCard
                ad={latestAd}
                onUpdateAd={(id, updates) => updateGeneratedAd(id, updates)}
                isConvertingToStory={convertingId === latestAd.id}
                onConvertToStory={
                  latestAd.format === "square"
                    ? () => handleConvertToStory(latestAd)
                    : undefined
                }
                onRegenerate={() => handleRegenerate(latestAd)}
              />

              {/* Action buttons row */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleDownloadAd(latestAd)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-primary-dark transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger
                </button>
                {latestAd.format === "square" && (
                  <button
                    onClick={() => handleConvertToStory(latestAd)}
                    disabled={convertingId === latestAd.id}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-xs font-medium text-muted hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {convertingId === latestAd.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Smartphone className="w-3.5 h-3.5" />
                    )}
                    Format Story
                  </button>
                )}
                <button
                  onClick={() => setShowModification(!showModification)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    showModification
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted hover:bg-white"
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => handleRegenerate(latestAd)}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-xs font-medium text-muted hover:bg-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regénérer
                </button>
              </div>

              {/* Modification panel */}
              {showModification && (
                <div className="mt-4 bg-white rounded-xl border border-border p-4 space-y-3">
                  <textarea
                    value={modificationPrompt}
                    onChange={(e) => setModificationPrompt(e.target.value)}
                    placeholder="Décrivez la modification souhaitée..."
                    rows={2}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted/50 resize-none"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {modificationChips.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setModificationPrompt(chip)}
                        className="px-3 py-1.5 rounded-full bg-surface border border-border text-xs text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={!modificationPrompt.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Appliquer
                  </button>
                </div>
              )}
            </div>

            {/* History gallery */}
            {historyAds.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Historique ({historyAds.length})
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {historyAds.map((ad) => (
                    <div key={ad.id} className="space-y-1.5">
                      <div
                        className={`relative ${
                          ad.format === "story" ? "aspect-[9/16]" : "aspect-square"
                        } rounded-xl overflow-hidden bg-black cursor-pointer group`}
                        onClick={() => handleDownloadAd(ad)}
                      >
                        <img
                          src={`data:${ad.mimeType};base64,${ad.imageBase64}`}
                          alt="Ad"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Download className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="absolute top-1.5 right-1.5 bg-black/50 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
                          {ad.format === "story" ? "Story" : "Carré"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted truncate">
                        {ad.headline}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* State 1: Empty */
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary/30" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                Prêt à créer
              </h2>
              <p className="text-sm text-muted max-w-xs">
                Configure ton produit et clique sur Générer pour créer ta
                première publicité.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
