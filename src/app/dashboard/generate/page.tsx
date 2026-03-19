"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { useToastStore } from "@/components/toast";
import ImageUploadZone from "@/components/image-upload-zone";
import type { Product } from "@/lib/types";
import {
  Loader2,
  Sparkles,
  AlertCircle,
  Zap,
  Shuffle,
  Pencil,
  ImageIcon,
  X,
  Wand2,
  Layers,
  ChevronLeft,
  Smartphone,
  RectangleHorizontal,
  Package,
  ArrowRight,
  Tag,
} from "lucide-react";

export default function GeneratePage() {
  const router = useRouter();
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
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

  // Product selection step
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedProductType, setSelectedProductType] = useState<"produit" | "service">("produit");
  const [customPrompt, setCustomPrompt] = useState("");
  const [launching, setLaunching] = useState(false);

  // Auto-select the correct product image when a product is selected
  useEffect(() => {
    if (!selectedProduct || uploadedImages.length === 0) return;
    // Find image linked to this product
    const productImg = uploadedImages.find(
      (img) => img.productId === selectedProduct.id
    );
    if (productImg) {
      setSelectedImage(productImg.id);
    } else if (!selectedImage) {
      // Fallback: first image if nothing selected yet
      setSelectedImage(uploadedImages[0].id);
    }
  }, [selectedProduct, uploadedImages, selectedImage]);

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

  // Fire-and-forget generation
  async function handleGenerate() {
    if (!brandAnalysis || !selectedProduct) return;
    setLaunching(true);

    const image = uploadedImages.find((i) => i.id === selectedImage) || uploadedImages[0];
    const offer = brandAnalysis.offers.find((o) => o.productId === selectedProduct.id) || null;

    // Create placeholder in store
    const placeholderId = startGeneration({
      format: selectedFormat,
      productId: selectedProduct.id,
    });

    // Redirect immediately
    router.push("/dashboard/ads");

    // Fire-and-forget
    doGeneration(placeholderId, selectedProduct, offer, image).catch(console.error);
  }

  async function doGeneration(
    placeholderId: string,
    product: Product,
    offer: { id: string; title: string; description: string; discountType?: string; discountValue?: string; originalPrice?: string; salePrice?: string; productId?: string; validUntil?: string } | null | undefined,
    image: (typeof uploadedImages)[number] | undefined
  ) {
    try {
      // Template selection for auto mode
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
        if (selectRes.ok) {
          const { templateIds } = await selectRes.json();
          templateId = templateIds?.[0];
        }
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
        await new Promise((r) => setTimeout(r, 2000));
        res = await fetch("/api/generate-ad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: genBody,
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        failGeneration(placeholderId, errData?.error || "La génération a échoué.");
        addToast({ type: "error", message: "Échec de la génération" });
        return;
      }

      const ad = await res.json();
      completeGeneration(placeholderId, ad);
      if (currentUser) syncGeneratedAd(currentUser.id, { ...ad, id: placeholderId });
      addToast({
        type: "success",
        message: "Publicité générée !",
        action: { label: "Voir", href: "/dashboard/ads" },
      });
    } catch (err) {
      failGeneration(placeholderId, "Erreur réseau.");
      addToast({ type: "error", message: "Erreur réseau lors de la génération" });
    }
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

  // ── STEP 1: Product Selection ──
  if (!selectedProduct) {
    return (
      <div className="-mt-8 flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <div className="max-w-2xl w-full px-6 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Quel produit veux-tu promouvoir ?
            </h1>
            <p className="text-sm text-muted mt-2">
              Sélectionne un produit pour créer une publicité
            </p>
          </div>

          {brandAnalysis.products.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-sm text-muted">Aucun produit configuré</p>
              <button
                onClick={() => router.push("/dashboard/brand")}
                className="text-sm text-primary font-semibold hover:underline"
              >
                Ajouter des produits dans Ma Marque
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {brandAnalysis.products.map((product) => {
                // Find product image
                const productImage = uploadedImages.find(
                  (img) => img.productId === product.id
                ) || uploadedImages[0];

                return (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="group card-tech p-4 text-left transition-all duration-300 hover:shadow-glow hover:border-primary/30"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Product image */}
                      {productImage ? (
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-border/40 flex-shrink-0">
                          <img
                            src={productImage.previewUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/40 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-primary/30" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        {product.price && (
                          <p className="text-xs font-semibold text-primary mt-1.5">
                            {product.price}
                          </p>
                        )}
                      </div>

                      <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── STEP 2: Generation Options ──
  return (
    <div className="-mt-8 flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
      <div className="max-w-lg w-full px-6 animate-fade-in-up">
        {/* Selected product header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSelectedProduct(null)}
            className="p-2 rounded-xl border border-border/60 bg-white text-muted hover:text-foreground hover:border-primary/20 transition-all shadow-soft"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center gap-3 card-tech px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {selectedProduct.name}
              </p>
              {selectedProduct.price && (
                <p className="text-xs text-primary font-medium">{selectedProduct.price}</p>
              )}
            </div>
          </div>
        </div>

        {/* Linked promotion */}
        {(() => {
          const offer = brandAnalysis.offers.find((o) => o.productId === selectedProduct.id);
          if (!offer) return null;
          const discount = offer.discountValue
            ? `${offer.discountType === "percentage" ? "-" : ""}${String(offer.discountValue).replace(/%+$/, "").replace(/€+$/, "")}${offer.discountType === "percentage" ? "%" : "€"}`
            : null;
          return (
            <div className="flex items-center gap-3 card-tech px-4 py-3 mb-5 border-emerald-200/60 bg-emerald-50/30">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-700 truncate">
                  {offer.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {discount && (
                    <span className="text-xs font-bold text-emerald-600">{discount}</span>
                  )}
                  {offer.originalPrice && offer.salePrice && (
                    <span className="text-[11px] text-muted">
                      <span className="line-through">{offer.originalPrice}</span>
                      {" → "}
                      <span className="font-semibold text-emerald-600">{offer.salePrice}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="space-y-5">
          {/* Images — show only images linked to selected product */}
          {(() => {
            const productImages = uploadedImages.filter(
              (img) => img.productId === selectedProduct.id
            );
            const imagesToShow = productImages.length > 0 ? productImages : uploadedImages;
            return imagesToShow.length > 0 ? (
            <section className="space-y-2.5">
              <h3 className="section-label flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                Image produit
              </h3>
              <div className="flex gap-2 flex-wrap">
                {imagesToShow.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.id)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                      selectedImage === img.id
                        ? "border-primary shadow-glow ring-1 ring-primary/20"
                        : "border-border/40 hover:border-primary/30"
                    }`}
                  >
                    <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </section>
          ) : null;
          })()}

          {/* Type + Format */}
          <section className="space-y-4">
            <h3 className="section-label flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Options
            </h3>

            {/* Type */}
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

            {/* Format */}
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

          <div className="border-t border-border/30" />

          {/* Mode */}
          <section className="space-y-3">
            <h3 className="section-label flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-primary" />
              Mode
            </h3>

            <div className="toggle-pill flex gap-0.5">
              {([
                { key: "auto" as const, label: "Auto", icon: Shuffle },
                { key: "custom" as const, label: "Prompt", icon: Pencil },
                { key: "reference" as const, label: "Réf.", icon: ImageIcon },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setGenerationMode(key);
                    if (key === "reference" && !customPrompt.trim()) {
                      setCustomPrompt("Réalise cette ads pour ma marque en retirant tous les éléments visuels de l'autre marque");
                    }
                  }}
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

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={launching || !canGenerate}
            className="btn-gradient w-full flex items-center justify-center gap-2.5 text-white py-3.5 rounded-xl text-sm font-semibold mt-2"
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
