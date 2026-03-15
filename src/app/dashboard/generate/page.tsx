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
  X,
  Wand2,
  Package,
  Tag,
  Layers,
  RectangleHorizontal,
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

  // Modification
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
      // Silent
    }
    setConvertingId(null);
  }

  // ── Regenerate ──
  async function handleRegenerate(ad: GeneratedAd) {
    setGenerating(true);
    setError("");
    const { product, offer, image } = getSelections();
    const genBody = JSON.stringify({
      brandAnalysis, product, offer,
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

  // ── Modify ──
  async function handleModification(ad: GeneratedAd, prompt: string) {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError("");
    const { product, offer, image } = getSelections();

    const genBody = JSON.stringify({
      brandAnalysis, product, offer,
      productImageBase64: image?.base64,
      productImageMimeType: image?.mimeType,
      brandLogoBase64: brandLogo?.base64,
      brandLogoMimeType: brandLogo?.mimeType,
      format: ad.format,
      templateId: ad.templateId || undefined,
      modificationPrompt: prompt.trim(),
      previousAdBase64: ad.imageBase64,
      previousAdMimeType: ad.mimeType,
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
        setModificationPrompt("");
        setShowModification(false);
      } else {
        const errData = await res.json().catch(() => null);
        setError(errData?.error || "La modification a échoué.");
      }
    } catch {
      setError("Erreur réseau lors de la modification.");
    }
    setGenerating(false);
  }

  // ── Download ──
  function handleDownloadAd(ad: GeneratedAd) {
    const link = document.createElement("a");
    link.href = `data:${ad.mimeType};base64,${ad.imageBase64}`;
    link.download = `kult-ad-${ad.format}-${Date.now()}.png`;
    link.click();
  }

  if (!brandAnalysis) {
    return (
      <div className="-mt-8 flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/5 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-muted" />
          </div>
          <p className="text-sm text-muted">
            Configure d&apos;abord ta marque dans &quot;Ma Marque&quot;
          </p>
          <button
            onClick={() => router.push("/dashboard/brand")}
            className="text-sm text-primary font-semibold hover:underline"
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
      <div className="w-[360px] flex-shrink-0 border-r border-border/50 bg-white flex flex-col h-full">
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 pt-6 pb-4 space-y-5">
          {/* ─ Section: Produit ─ */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <Package className="w-3 h-3 text-primary" />
              </div>
              <h3 className="section-label">Produit</h3>
            </div>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="select-clean w-full px-3.5 py-2.5 input-tech text-sm"
            >
              {brandAnalysis.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.price ? ` — ${p.price}` : ""}
                </option>
              ))}
            </select>

            {/* Product images */}
            {uploadedImages.length > 0 && (
              <div className="flex gap-2">
                {uploadedImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.id)}
                    className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                      selectedImage === img.id
                        ? "border-primary shadow-glow ring-1 ring-primary/20"
                        : "border-border/40 hover:border-primary/30"
                    }`}
                  >
                    <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ─ Section: Offre ─ */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <Tag className="w-3 h-3 text-primary" />
              </div>
              <h3 className="section-label">Offre</h3>
            </div>
            <select
              value={selectedOffer}
              onChange={(e) => setSelectedOffer(e.target.value)}
              className="select-clean w-full px-3.5 py-2.5 input-tech text-sm"
            >
              <option value="">Sans offre</option>
              {brandAnalysis.offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                  {o.salePrice ? ` — ${o.salePrice}` : o.discountValue ? ` (${o.discountValue})` : ""}
                </option>
              ))}
            </select>
          </section>

          {/* ─ Divider ─ */}
          <div className="border-t border-border/30" />

          {/* ─ Type + Format ─ */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <Layers className="w-3 h-3 text-primary" />
              </div>
              <h3 className="section-label">Options</h3>
            </div>

            {/* Type toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted">Type</label>
              <div className="toggle-pill flex gap-0.5">
                {(["produit", "service"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedProductType(type)}
                    className={`flex-1 py-2 rounded-[10px] text-xs font-medium transition-all duration-200 ${
                      selectedProductType === type
                        ? "toggle-pill-active"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {type === "produit" ? "Produit" : "Service"}
                  </button>
                ))}
              </div>
            </div>

            {/* Format toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted">Format</label>
              <div className="toggle-pill flex gap-0.5">
                {([
                  { key: "square" as const, label: "Carré", icon: RectangleHorizontal },
                  { key: "story" as const, label: "Story", icon: Smartphone },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFormat(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium transition-all duration-200 ${
                      selectedFormat === key
                        ? "toggle-pill-active"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ─ Divider ─ */}
          <div className="border-t border-border/30" />

          {/* ─ Generation mode ─ */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <Wand2 className="w-3 h-3 text-primary" />
              </div>
              <h3 className="section-label">Mode</h3>
            </div>

            <div className="toggle-pill flex gap-0.5">
              {([
                { key: "auto" as const, label: "Auto", icon: Shuffle },
                { key: "custom" as const, label: "Prompt", icon: Pencil },
                { key: "reference" as const, label: "Réf.", icon: ImageIcon },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setGenerationMode(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium transition-all duration-200 ${
                    generationMode === key
                      ? "toggle-pill-active"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Mode content */}
            <div>
              {generationMode === "auto" && (
                <div className="flex items-center gap-2.5 bg-gradient-to-r from-primary/[0.04] to-accent/[0.04] rounded-xl px-3.5 py-3 border border-primary/10">
                  <Sparkles className="w-4 h-4 text-primary/60 flex-shrink-0" />
                  <p className="text-xs text-muted leading-relaxed">
                    L&apos;IA choisit le meilleur template automatiquement.
                  </p>
                </div>
              )}

              {generationMode === "custom" && (
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ex: Le produit posé sur une table en marbre blanc avec un fond rose doux..."
                  rows={3}
                  className="w-full px-3.5 py-3 input-tech text-sm placeholder:text-muted/40 resize-none"
                />
              )}

              {generationMode === "reference" && (
                <div className="space-y-2.5">
                  {referenceAd ? (
                    <div className="relative group">
                      <img
                        src={`data:${referenceAd.mimeType};base64,${referenceAd.base64}`}
                        alt="Référence"
                        className="w-full rounded-xl border border-border/60"
                      />
                      <button
                        onClick={() => setReferenceAd(null)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
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
                    placeholder="Instructions pour adapter la référence..."
                    rows={2}
                    className="w-full px-3.5 py-3 input-tech text-sm placeholder:text-muted/40 resize-none"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200/60 rounded-xl p-3.5 animate-scale-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        {/* ─ Generate button ─ */}
        <div className="p-4 border-t border-border/30 bg-white">
          <button
            onClick={handleGenerate}
            disabled={generating || !canGenerate}
            className="btn-gradient w-full flex items-center justify-center gap-2.5 text-white py-3.5 rounded-xl text-sm font-semibold"
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
      <div className="flex-1 h-full overflow-y-auto bg-surface/60 bg-dots scrollbar-thin">
        {generating ? (
          /* ── Loading state ── */
          <div className="flex flex-col items-center justify-center h-full gap-8 animate-fade-in-up">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl btn-gradient flex items-center justify-center shadow-glow-lg animate-pulse-glow">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <div className="absolute -inset-3 rounded-[28px] border border-primary/10 animate-spin-slow" style={{ borderTopColor: 'rgba(99,102,241,0.3)' }} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                Création en cours...
              </h3>
              <p className="text-sm text-muted">
                Cela prend généralement 30 à 60 secondes
              </p>
            </div>
            <GrowthTips />
          </div>
        ) : latestAd ? (
          /* ── Result state ── */
          <div className="p-8 space-y-8 animate-fade-in-up">
            <div className="max-w-md mx-auto space-y-4">
              {/* Title */}
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-accent" />
                Dernière création
              </h2>

              {/* Ad preview with built-in controls */}
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

              {/* Extra actions (modify / regenerate) */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModification(!showModification)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    showModification
                      ? "bg-primary/8 text-primary border border-primary/20 shadow-glow"
                      : "bg-white border border-border/60 text-muted hover:text-foreground hover:border-primary/20 shadow-soft"
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => handleRegenerate(latestAd)}
                  disabled={generating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/60 bg-white text-xs font-medium text-muted hover:text-foreground hover:border-primary/20 transition-all duration-200 shadow-soft disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regénérer
                </button>
              </div>

              {/* Modification panel */}
              {showModification && (
                <div className="card-tech p-4 space-y-3 animate-scale-in">
                  <textarea
                    value={modificationPrompt}
                    onChange={(e) => setModificationPrompt(e.target.value)}
                    placeholder="Décrivez la modification souhaitée..."
                    rows={2}
                    className="w-full px-3.5 py-3 input-tech text-sm placeholder:text-muted/40 resize-none"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {modificationChips.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setModificationPrompt(chip)}
                        className="chip-tech px-3 py-1.5 text-[11px] font-medium text-muted"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={!modificationPrompt.trim() || generating}
                    onClick={() => latestAd && handleModification(latestAd, modificationPrompt)}
                    className="btn-gradient w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl text-xs font-semibold"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Modification en cours...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        Appliquer la modification
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* History */}
            {historyAds.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-accent" />
                  <h3 className="text-sm font-semibold text-foreground">Historique</h3>
                  <span className="text-[10px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                    {historyAds.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {historyAds.map((ad) => (
                    <div key={ad.id} className="group cursor-pointer" onClick={() => handleDownloadAd(ad)}>
                      <div
                        className={`relative ${
                          ad.format === "story" ? "aspect-[9/16]" : "aspect-square"
                        } rounded-xl overflow-hidden bg-black shadow-soft transition-all duration-300 group-hover:shadow-glow`}
                      >
                        <img
                          src={`data:${ad.mimeType};base64,${ad.imageBase64}`}
                          alt="Ad"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                          <Download className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <span className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[9px] font-medium px-2 py-0.5 rounded-full">
                          {ad.format === "story" ? "Story" : "Carré"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center h-full gap-5 animate-fade-in-up">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 flex items-center justify-center animate-float">
                <Wand2 className="w-9 h-9 text-primary/40" />
              </div>
              <div className="absolute -inset-1 rounded-[28px] border border-dashed border-primary/15" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-foreground">
                Prêt à créer
              </h2>
              <p className="text-sm text-muted max-w-xs leading-relaxed">
                Configure ton produit et clique sur <span className="font-semibold text-gradient">Générer</span> pour créer ta première publicité.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
