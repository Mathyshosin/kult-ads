"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { useToastStore } from "@/components/toast";
import ImageUploadZone from "@/components/image-upload-zone";
import type { Product, GenerationMode } from "@/lib/types";
import {
  Loader2,
  Sparkles,
  AlertCircle,
  Zap,
  Shuffle,
  Pencil,
  ImageIcon,
  X,
  ChevronLeft,
  Smartphone,
  RectangleHorizontal,
  Package,
  ArrowRight,
  Tag,
  BookOpen,
  Copy,
  Crown,
  Plus,
} from "lucide-react";

// ── Step indicator ──
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-all ${
            i < current ? "bg-blue-500" : i === current ? "bg-blue-500 w-6" : "bg-gray-200"
          }`} />
        </div>
      ))}
    </div>
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const isHydrated = useWizardStore((s) => s.isHydrated);
  const uploadedImages = useWizardStore((s) => s.uploadedImages);
  const brandLogo = useWizardStore((s) => s.brandLogo);
  const generationMode = useWizardStore((s) => s.generationMode);
  const setGenerationMode = useWizardStore((s) => s.setGenerationMode);
  const selectedFormat = useWizardStore((s) => s.selectedFormat);
  const setSelectedFormat = useWizardStore((s) => s.setSelectedFormat);
  const referenceAd = useWizardStore((s) => s.referenceAd);
  const setReferenceAd = useWizardStore((s) => s.setReferenceAd);
  const startGeneration = useWizardStore((s) => s.startGeneration);
  const completeGeneration = useWizardStore((s) => s.completeGeneration);
  const failGeneration = useWizardStore((s) => s.failGeneration);
  const syncGeneratedAd = useWizardStore((s) => s.syncGeneratedAd);
  const currentUser = useAuthStore((s) => s.currentUser);
  const addToast = useToastStore((s) => s.addToast);

  const [step, setStep] = useState<"mode" | "library" | "product" | "options">("mode");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [launching, setLaunching] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ id: string; format: string; category?: string; previewUrl: string }[]>([]);
  const [libraryFilter, setLibraryFilter] = useState("all");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [editedOffer, setEditedOffer] = useState<{ title: string; discountValue: string; originalPrice: string; salePrice: string } | null>(null);
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [ctaText, setCtaText] = useState("");

  // Clear reference ad on unmount (don't persist between visits)
  useEffect(() => {
    return () => { setReferenceAd(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-load offer for product
  useEffect(() => {
    if (!selectedProduct || !brandAnalysis) { setEditedOffer(null); return; }
    const offer = brandAnalysis.offers.find((o) => o.productId === selectedProduct.id);
    if (offer) {
      setEditedOffer({
        title: offer.title || "",
        discountValue: offer.discountValue || "",
        originalPrice: offer.originalPrice || "",
        salePrice: offer.salePrice || "",
      });
    } else {
      setEditedOffer(null);
    }
  }, [selectedProduct, brandAnalysis]);

  // Auto-select image only when product changes (not when selectedImage changes)
  useEffect(() => {
    if (!selectedProduct || uploadedImages.length === 0) return;
    const productImg = uploadedImages.find((img) => img.productId === selectedProduct.id);
    if (productImg) {
      setSelectedImage(productImg.id);
    } else {
      setSelectedImage(uploadedImages[0]?.id || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, uploadedImages]);

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

  const handleModeSelect = async (mode: GenerationMode) => {
    setGenerationMode(mode);
    if (mode === "library") {
      setStep("library");
      setLoadingTemplates(true);
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
        }
      } catch { /* ignore */ }
      setLoadingTemplates(false);
    } else {
      setStep("product");
    }
  };

  async function handleGenerate() {
    if (!brandAnalysis || !selectedProduct) return;
    setLaunching(true);

    const image = uploadedImages.find((i) => i.id === selectedImage) || uploadedImages[0];
    const baseOffer = brandAnalysis.offers.find((o) => o.productId === selectedProduct.id) || null;
    const offer = editedOffer && baseOffer ? { ...baseOffer, ...editedOffer } : baseOffer;

    const placeholderId = startGeneration({
      format: selectedFormat,
      productId: selectedProduct.id,
    });

    router.push("/dashboard/ads");

    doGeneration(placeholderId, selectedProduct, offer, image).catch(console.error);
  }

  async function doGeneration(
    placeholderId: string,
    product: Product,
    offer: { id: string; title: string; description: string; discountType?: string; discountValue?: string; originalPrice?: string; salePrice?: string; productId?: string; validUntil?: string } | null | undefined,
    image: (typeof uploadedImages)[number] | undefined
  ) {
    try {
      let templateId: string | undefined = selectedTemplateId || undefined;

      if (generationMode === "auto" && !templateId) {
        const selectRes = await fetch("/api/templates/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format: selectedFormat, count: 1 }),
        });
        if (selectRes.ok) {
          const { templateIds } = await selectRes.json();
          templateId = templateIds?.[0];
        }
      }

      if (!brandAnalysis) return;
      // Compress images before sending to reduce upload time (~2MB → ~200KB)
      const { compressBase64 } = await import("@/lib/image-utils");

      let compressedProduct: { base64: string; mimeType: string } | undefined;
      if (image?.base64) {
        compressedProduct = await compressBase64(image.base64, image.mimeType);
      }

      let compressedRef: { base64: string; mimeType: string } | undefined;
      if (generationMode === "reference" && referenceAd?.base64) {
        compressedRef = await compressBase64(referenceAd.base64, referenceAd.mimeType);
      }

      // Send only essential data — no logo, no full brandAnalysis bloat
      const genBody = JSON.stringify({
        brandAnalysis: {
          brandName: brandAnalysis.brandName,
          brandDescription: brandAnalysis.brandDescription,
          tone: brandAnalysis.tone,
          colors: brandAnalysis.colors,
          targetAudience: brandAnalysis.targetAudience,
          uniqueSellingPoints: brandAnalysis.uniqueSellingPoints,
          products: brandAnalysis.products,
          offers: brandAnalysis.offers,
        },
        product,
        offer,
        productImageBase64: compressedProduct?.base64,
        productImageMimeType: compressedProduct?.mimeType,
        format: selectedFormat,
        templateId: generationMode === "library" ? selectedTemplateId : templateId,
        customPrompt: generationMode === "custom" ? customPrompt.trim() || undefined : undefined,
        referenceAdBase64: compressedRef?.base64,
        referenceAdMimeType: compressedRef?.mimeType,
        referenceInstruction:
          generationMode === "reference"
            ? customPrompt.trim() || undefined
            : undefined,
        ctaText: ctaEnabled && ctaText.trim() ? ctaText.trim() : undefined,
      });

      let res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: genBody,
      });

      // Auto-retry up to 2 times on failure (3 attempts total)
      for (let retry = 0; retry < 2 && !res.ok && res.status !== 402; retry++) {
        console.log(`[generate] Retry ${retry + 1}...`);
        await new Promise((r) => setTimeout(r, 1500));
        res = await fetch("/api/generate-ad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: genBody,
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (errData?.code === "NO_CREDITS") {
          failGeneration(placeholderId, "Plus de crédits disponibles.");
          addToast({
            type: "error",
            message: "Plus de crédits ! Passez au plan supérieur.",
            action: { label: "Voir les offres", href: "/dashboard/subscription" },
          });
          return;
        }
        failGeneration(placeholderId, errData?.error || "La génération a échoué.");
        addToast({ type: "error", message: "Échec de la génération" });
        return;
      }

      const ad = await res.json();
      completeGeneration(placeholderId, ad);
      if (currentUser) syncGeneratedAd(currentUser.id, { ...ad, id: placeholderId });
      // Update credits counter in header
      window.dispatchEvent(new Event("credits-updated"));
      addToast({
        type: "success",
        message: "Publicité générée !",
        action: { label: "Voir", href: "/dashboard/ads" },
      });
    } catch {
      failGeneration(placeholderId, "Erreur réseau.");
      addToast({ type: "error", message: "Erreur réseau lors de la génération" });
    }
  }

  // ── Loading state while hydrating ──
  if (!isHydrated) {
    return (
      <div className="-mt-8 flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-sm text-gray-500">Chargement...</span>
        </div>
      </div>
    );
  }

  // ── Not configured (only shown after hydration) ──
  if (!brandAnalysis) {
    return (
      <div className="-mt-8 flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-gray-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">Configurez votre marque</p>
            <p className="text-sm text-gray-400 mt-1">Analysez votre site pour commencer à créer des ads</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/brand")}
            className="text-sm text-blue-500 font-semibold hover:underline"
          >
            Configurer ma marque →
          </button>
        </div>
      </div>
    );
  }

  const canGenerate =
    !!selectedProduct &&
    (generationMode !== "custom" || !!customPrompt.trim()) &&
    (generationMode !== "reference" || !!referenceAd);

  // ══════════════════════════════════════════
  // STEP 0: Choose Generation Mode
  // ══════════════════════════════════════════
  if (step === "mode") {
    const modes: { key: GenerationMode; icon: React.ElementType; title: string; description: string; badge?: string; gradient: string }[] = [
      {
        key: "auto",
        icon: Shuffle,
        title: "Ads Aléatoire",
        description: "L'IA choisit le meilleur template et crée votre ad automatiquement",
        badge: "Le plus utilisé",
        gradient: "from-blue-500 to-cyan-400",
      },
      {
        key: "library",
        icon: BookOpen,
        title: "Depuis la Bibliothèque",
        description: "Parcourez notre catalogue d'ads performantes et copiez celle qui vous plaît",
        badge: "Recommandé",
        gradient: "from-violet-500 to-purple-400",
      },
      {
        key: "reference",
        icon: Copy,
        title: "Copy-Ads",
        description: "Uploadez une ad que vous aimez et on la reproduit pour votre marque",
        gradient: "from-amber-500 to-orange-400",
      },
      {
        key: "custom",
        icon: Pencil,
        title: "Prompt Personnalisé",
        description: "Décrivez exactement l'ad que vous voulez avec vos propres instructions",
        gradient: "from-emerald-500 to-teal-400",
      },
    ];

    return (
      <div className="-mt-8 flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <div className="max-w-3xl w-full px-4 sm:px-6 animate-fade-in-up">
          <div className="text-center mb-10">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Comment voulez-vous créer votre ad ?
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Choisissez votre méthode de création
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modes.map((mode) => (
              <button
                key={mode.key}
                onClick={() => handleModeSelect(mode.key)}
                className="group relative bg-white rounded-2xl border border-gray-200 p-6 text-left hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {mode.badge && (
                  <span className="absolute -top-2.5 left-4 text-[10px] font-bold text-white bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-1 rounded-full shadow-sm">
                    {mode.badge}
                  </span>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                  <mode.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {mode.title}
                </h3>
                <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                  {mode.description}
                </p>
                <ArrowRight className="absolute top-6 right-5 w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // STEP: Library — browse and pick a template
  // ══════════════════════════════════════════
  if (step === "library") {
    return (
      <div className="-mt-8 min-h-[calc(100vh-3.5rem)] py-12">
        <div className="max-w-5xl mx-auto px-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setStep("mode")}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-blue-200 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Choisissez une ad à copier</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {libraryFilter === "all" ? templates.length : templates.filter((t) => t.category === libraryFilter).length} ads disponibles — cliquez pour sélectionner
              </p>
            </div>
          </div>

          {/* Category filters */}
          {!loadingTemplates && templates.length > 0 && (
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {[
                { id: "all", label: "Tous" },
                { id: "benefit", label: "Bénéfice" },
                { id: "social-proof", label: "Social Proof" },
                { id: "promo", label: "Promo" },
                { id: "comparison", label: "Comparaison" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setLibraryFilter(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    libraryFilter === cat.id
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {loadingTemplates ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-500">Chargement du catalogue...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">Aucun template disponible pour le moment</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
              {templates.filter((t) => libraryFilter === "all" || t.category === libraryFilter).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplateId(t.id);
                    setStep("product");
                  }}
                  className={`group relative rounded-2xl overflow-hidden bg-gray-100 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 active:scale-[0.97] break-inside-avoid w-full ${
                    selectedTemplateId === t.id ? "ring-3 ring-blue-500" : ""
                  } ${t.format === "story" ? "aspect-[9/16]" : "aspect-square"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.previewUrl}
                    alt="Template"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/80 via-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-600 text-xs font-bold shadow-lg">
                      <Copy className="w-3.5 h-3.5" />
                      Copier cette ad
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // STEP 1: Product Selection
  // ══════════════════════════════════════════
  if (step === "product" || !selectedProduct) {
    return (
      <div className="-mt-8 flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <div className="max-w-2xl w-full px-6 animate-fade-in-up">
          <StepIndicator current={1} total={3} />

          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => { setStep("mode"); setSelectedProduct(null); }}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-blue-200 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Quel produit promouvoir ?
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {generationMode === "auto" ? "Ads Aléatoire" : generationMode === "library" ? "Depuis la Bibliothèque" : generationMode === "reference" ? "Copy-Ads" : "Prompt Personnalisé"}
              </p>
            </div>
          </div>

          {brandAnalysis.products.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">Aucun produit configuré</p>
              <button
                onClick={() => router.push("/dashboard/brand")}
                className="text-sm text-blue-500 font-semibold hover:underline"
              >
                Ajouter des produits →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {brandAnalysis.products.map((product) => {
                const productImage = uploadedImages.find((img) => img.productId === product.id) || uploadedImages[0];
                return (
                  <button
                    key={product.id}
                    onClick={() => { setSelectedProduct(product); setStep("options"); }}
                    className="group w-full bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-blue-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      {productImage ? (
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                          <img src={productImage.previewUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.description}</p>
                        )}
                        {product.price && (
                          <p className="text-xs font-semibold text-blue-500 mt-1">{product.price}</p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </button>
                );
              })}

              {/* Add new product */}
              <button
                onClick={() => router.push("/dashboard/brand")}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Ajouter un produit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // STEP 2: Generation Options
  // ══════════════════════════════════════════
  return (
    <div className="-mt-8 flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
      <div className="max-w-lg w-full px-6 animate-fade-in-up">
        <StepIndicator current={2} total={3} />

        {/* Back + selected product */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setSelectedProduct(null); setStep("product"); }}
            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-blue-200 transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{selectedProduct.name}</p>
              {selectedProduct.price && <p className="text-xs text-blue-500 font-medium">{selectedProduct.price}</p>}
            </div>
          </div>
        </div>

        {/* Editable promotion */}
        {editedOffer && (
          <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200/60 px-4 py-3 mb-5 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Tag className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Offre</span>
            </div>
            <input
              type="text"
              value={editedOffer.title}
              onChange={(e) => setEditedOffer({ ...editedOffer, title: e.target.value })}
              className="w-full text-xs font-semibold text-emerald-800 bg-white/60 border border-emerald-200/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              placeholder="Nom de l'offre"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 mb-0.5 block">Réduction</label>
                <input
                  type="text"
                  value={editedOffer.discountValue}
                  onChange={(e) => setEditedOffer({ ...editedOffer, discountValue: e.target.value })}
                  className="w-full text-xs bg-white/60 border border-emerald-200/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder="-20%"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 mb-0.5 block">Prix d&apos;origine</label>
                <input
                  type="text"
                  value={editedOffer.originalPrice}
                  onChange={(e) => setEditedOffer({ ...editedOffer, originalPrice: e.target.value })}
                  className="w-full text-xs bg-white/60 border border-emerald-200/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder="99€"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 mb-0.5 block">Prix promo</label>
                <input
                  type="text"
                  value={editedOffer.salePrice}
                  onChange={(e) => setEditedOffer({ ...editedOffer, salePrice: e.target.value })}
                  className="w-full text-xs bg-white/60 border border-emerald-200/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-emerald-600 font-semibold"
                  placeholder="75€"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {/* Product images */}
          {(() => {
            const productImages = uploadedImages.filter((img) => img.productId === selectedProduct.id);
            const imagesToShow = productImages.length > 0 ? productImages : uploadedImages;
            return imagesToShow.length > 0 ? (
              <section className="space-y-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  Image produit
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {imagesToShow.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.id)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                        selectedImage === img.id
                          ? "border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </section>
            ) : null;
          })()}

          {/* Format */}
          <section className="space-y-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Format</h3>
            <div className="flex gap-3">
              {([
                { key: "square" as const, label: "Carré", sub: "1:1", icon: RectangleHorizontal },
                { key: "story" as const, label: "Story", sub: "9:16", icon: Smartphone },
              ]).map(({ key, label, sub, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSelectedFormat(key)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all ${
                    selectedFormat === key
                      ? "border-blue-500 bg-blue-50/50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="text-[10px] text-gray-400">{sub}</span>
                </button>
              ))}
            </div>
          </section>

          {/* CTA option */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Bouton CTA</h3>
              <button
                onClick={() => setCtaEnabled(!ctaEnabled)}
                className={`relative w-10 h-5.5 rounded-full transition-colors ${ctaEnabled ? "bg-blue-500" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${ctaEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            {ctaEnabled && (
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Ex: Découvrir, Commander, J'en profite..."
                className="w-full text-sm bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            )}
          </section>

          {/* Mode-specific content */}
          {generationMode === "custom" && (
            <section className="space-y-2.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5 text-blue-500" />
                Votre prompt
              </h3>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ex: Le produit posé sur une table en marbre blanc avec un fond rose doux..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 outline-none resize-none"
              />
            </section>
          )}

          {generationMode === "reference" && (
            <section className="space-y-2.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-blue-500" />
                Ad à copier
              </h3>
              {referenceAd ? (
                <div className="relative group">
                  <img
                    src={`data:${referenceAd.mimeType};base64,${referenceAd.base64}`}
                    alt="Référence"
                    className="w-full rounded-xl border border-gray-200"
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
                placeholder="Réalise cette ads pour ma marque en retirant tous les éléments visuels de l'autre marque"
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 outline-none resize-none"
              />
            </section>
          )}

          {generationMode === "auto" && (
            <div className="flex items-center gap-3 bg-blue-50/50 rounded-2xl px-4 py-3 border border-blue-100">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <p className="text-sm text-gray-500">
                L&apos;IA choisit le meilleur template et génère votre ad automatiquement.
              </p>
            </div>
          )}

          {generationMode === "library" && (
            <div className="flex items-center gap-3 bg-violet-50/50 rounded-2xl px-4 py-3 border border-violet-100">
              <BookOpen className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <p className="text-sm text-gray-500">
                Un template sera sélectionné depuis notre bibliothèque pour créer votre ad.
              </p>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={launching || !canGenerate}
            className="w-full flex items-center justify-center gap-2.5 text-white py-4 rounded-2xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-violet-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {launching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Lancement...
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
    </div>
  );
}
