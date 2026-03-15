"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import ImageUploadZone from "@/components/image-upload-zone";
import InlineEditableField from "@/components/inline-editable-field";
import {
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Plus,
  X,
  Wand2,
  Scissors,
  Check,
  Trash2,
  Package,
  Tag,
  ImageIcon,
  Building2,
  Search,
  Save,
  Camera,
} from "lucide-react";

// ── Scene types for AI generation ──
const sceneTypes = [
  { id: "hands", label: "Tenu en main", prompt: "A person's hands elegantly holding the product, soft natural lighting, lifestyle photography" },
  { id: "table", label: "Sur une table", prompt: "Product placed on a modern minimalist table, soft shadows, professional product photography" },
  { id: "lifestyle", label: "Lifestyle", prompt: "Product in a lifestyle scene, person using the product naturally, warm atmosphere" },
  { id: "white", label: "Fond blanc", prompt: "Product on a clean white background, professional studio lighting, e-commerce style" },
  { id: "custom", label: "Personnalisé", prompt: "" },
];

// ── Analysis phases ──
const phases = [
  "Chargement du site...",
  "Analyse IA & récupération des images...",
  "Finalisation...",
];

// ── Collapsible Section wrapper ──
function Section({
  title,
  icon: Icon,
  defaultOpen = true,
  badge,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  badge?: string | number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card-tech overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge !== undefined && (
            <span className="text-[10px] bg-primary/8 text-primary font-semibold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`transition-all duration-200 ease-in-out ${
          open ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );
}

// ── Save indicator ──
function SaveIndicator({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-glow animate-scale-in">
      <CheckCircle2 className="w-4 h-4" />
      Sauvegardé
    </div>
  );
}

export default function BrandPage() {
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const setBrandAnalysis = useWizardStore((s) => s.setBrandAnalysis);
  const updateBrandAnalysis = useWizardStore((s) => s.updateBrandAnalysis);
  const updateProduct = useWizardStore((s) => s.updateProduct);
  const removeProduct = useWizardStore((s) => s.removeProduct);
  const addProduct = useWizardStore((s) => s.addProduct);
  const updateOffer = useWizardStore((s) => s.updateOffer);
  const removeOffer = useWizardStore((s) => s.removeOffer);
  const addOffer = useWizardStore((s) => s.addOffer);
  const uploadedImages = useWizardStore((s) => s.uploadedImages);
  const addImage = useWizardStore((s) => s.addImage);
  const removeImage = useWizardStore((s) => s.removeImage);
  const brandLogo = useWizardStore((s) => s.brandLogo);
  const setBrandLogo = useWizardStore((s) => s.setBrandLogo);
  const syncBrandAnalysis = useWizardStore((s) => s.syncBrandAnalysis);
  const syncImage = useWizardStore((s) => s.syncImage);
  const syncLogo = useWizardStore((s) => s.syncLogo);
  const syncDeleteImage = useWizardStore((s) => s.syncDeleteImage);
  const syncDeleteLogo = useWizardStore((s) => s.syncDeleteLogo);
  const currentUser = useAuthStore((s) => s.currentUser);

  // ── Analysis state ──
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState(-1);
  const [analysisError, setAnalysisError] = useState("");
  const isLoading = phase >= 0;

  // ── Image state ──
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [sceneType, setSceneType] = useState("hands");
  const [customPrompt, setCustomPrompt] = useState("");
  const [imageError, setImageError] = useState("");
  const [removingBgId, setRemovingBgId] = useState<string | null>(null);

  // ── Expanded product/offer ──
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);

  // ── Save indicator ──
  const [showSaved, setShowSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prefill URL from existing analysis
  useEffect(() => {
    if (brandAnalysis?.url) {
      setUrl(brandAnalysis.url);
    }
    if (brandAnalysis?.products?.length && !selectedProduct) {
      setSelectedProduct(brandAnalysis.products[0].id);
    }
  }, [brandAnalysis, selectedProduct]);

  // ── Debounced sync to Supabase ──
  const debouncedSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      if (currentUser) {
        await syncBrandAnalysis(currentUser.id);
      }
      // Show saved indicator
      setShowSaved(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
    }, 500);
  }, [currentUser, syncBrandAnalysis]);

  // ── Analysis handler ──
  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setAnalysisError("");
    setPhase(0);

    try {
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!scrapeRes.ok) {
        const data = await scrapeRes.json();
        throw new Error(data.error || "Erreur lors du chargement du site");
      }

      const scrapedData = await scrapeRes.json();
      setPhase(1);

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrapedData }),
      });

      if (!analyzeRes.ok) {
        const data = await analyzeRes.json();
        throw new Error(data.error || "Erreur lors de l'analyse");
      }

      const analysis = await analyzeRes.json();
      setPhase(2);

      // Extract downloaded product images before setting brand analysis
      const downloadedProductImages = analysis.downloadedProductImages || [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { downloadedProductImages: _imgs, ...cleanAnalysis } = analysis;

      setBrandAnalysis({ ...cleanAnalysis, url: url.trim() });

      // ── Sync brand analysis FIRST to get brandAnalysisId (required for image uploads) ──
      if (currentUser) {
        await syncBrandAnalysis(currentUser.id);
      }

      // ── Auto-import scraped product images (AFTER brandAnalysisId is set) ──
      if (downloadedProductImages.length > 0) {
        for (const img of downloadedProductImages) {
          const filename = img.imageUrl.split("/").pop()?.split("?")[0] || "product.jpg";
          const newImage = {
            id: `scraped-${img.productId}-${Date.now()}`,
            previewUrl: `data:${img.mimeType};base64,${img.base64}`,
            base64: img.base64,
            mimeType: img.mimeType,
            name: filename,
            productId: img.productId,
            isAiGenerated: false,
          };
          addImage(newImage);
          if (currentUser) await syncImage(currentUser.id, newImage);
        }
        console.log(`[brand] Auto-imported ${downloadedProductImages.length} product images`);
      }

      setPhase(-1);
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
      setPhase(-1);
    }
  }

  // ── Brand field save handler ──
  function handleBrandFieldSave(key: string, value: string) {
    if (key === "uniqueSellingPoints" || key === "competitorProducts") {
      updateBrandAnalysis({
        [key]: value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
    } else {
      updateBrandAnalysis({ [key]: value });
    }
    debouncedSync();
  }

  // ── Product field save ──
  function handleProductFieldSave(
    productId: string,
    key: string,
    value: string
  ) {
    if (key === "features") {
      updateProduct(productId, {
        features: value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
    } else {
      updateProduct(productId, { [key]: value });
    }
    debouncedSync();
  }

  // ── Offer field save ──
  function handleOfferFieldSave(offerId: string, key: string, value: string) {
    updateOffer(offerId, { [key]: value });
    debouncedSync();
  }

  // ── Image upload ──
  async function handleUpload(files: File[]) {
    setUploading(true);
    setImageError("");
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
        const newImage = {
          id: img.id,
          previewUrl: img.dataUrl,
          base64: img.base64,
          mimeType: img.mimeType,
          name: img.name,
          isAiGenerated: false,
        };
        addImage(newImage);
        if (currentUser) await syncImage(currentUser.id, newImage);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  // ── Logo upload ──
  async function handleLogoUpload(files: File[]) {
    if (files.length === 0) return;
    setImageError("");
    try {
      const formData = new FormData();
      formData.append("images", files[0]);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const { images } = await res.json();
      if (images[0]) {
        const logo = {
          base64: images[0].base64,
          mimeType: images[0].mimeType,
          previewUrl: images[0].dataUrl,
        };
        setBrandLogo(logo);
        if (currentUser) syncLogo(currentUser.id, logo);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Erreur upload logo");
    }
  }

  // ── Background removal ──
  const removeBackground = useCallback(
    async (imageId: string) => {
      const img = uploadedImages.find((i) => i.id === imageId);
      if (!img) return;

      setRemovingBgId(imageId);
      try {
        const { removeBackground: removeBg } = await import(
          "@imgly/background-removal"
        );

        const response = await fetch(
          `data:${img.mimeType};base64,${img.base64}`
        );
        const blob = await response.blob();

        const resultBlob = await removeBg(blob, {
          progress: (key: string, current: number, total: number) => {
            console.log(`[bg-removal] ${key}: ${current}/${total}`);
          },
        });

        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
          };
        });
        reader.readAsDataURL(resultBlob);
        const newBase64 = await base64Promise;

        removeImage(imageId);
        addImage({
          ...img,
          base64: newBase64,
          mimeType: "image/png",
          previewUrl: `data:image/png;base64,${newBase64}`,
          name: img.name.replace(/\.\w+$/, "-detoured.png"),
        });
      } catch (err) {
        console.error("Background removal error:", err);
        setImageError("Erreur lors du détourage. Réessayez.");
      } finally {
        setRemovingBgId(null);
      }
    },
    [uploadedImages, removeImage, addImage]
  );

  // ── AI generation ──
  async function handleGenerate() {
    if (!brandAnalysis) return;
    setGenerating(true);
    setImageError("");
    try {
      const scene = sceneTypes.find((s) => s.id === sceneType);
      const product = brandAnalysis.products.find(
        (p) => p.id === selectedProduct
      );

      const basePrompt =
        sceneType === "custom" ? customPrompt : scene?.prompt;
      const prompt = `${basePrompt}. Product: ${product?.name || "the product"} by ${brandAnalysis.brandName}. High quality, professional advertising photography.`;

      const refImage = uploadedImages.find(
        (img) => img.productId === selectedProduct || !img.productId
      );

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio: "1:1",
          referenceImageBase64: refImage?.base64,
          referenceImageMimeType: refImage?.mimeType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const result = await res.json();
      const newImage = {
        id: `ai-${Date.now()}`,
        previewUrl: `data:${result.mimeType};base64,${result.imageBase64}`,
        base64: result.imageBase64,
        mimeType: result.mimeType,
        name: `${product?.name || "product"}-${sceneType}.png`,
        productId: selectedProduct,
        isAiGenerated: true,
        prompt,
      };
      addImage(newImage);
      if (currentUser) await syncImage(currentUser.id, newImage);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Erreur génération");
    } finally {
      setGenerating(false);
    }
  }

  // ── Image product association ──
  function handleImageProductChange(imageId: string, productId: string) {
    const img = uploadedImages.find((i) => i.id === imageId);
    if (!img) return;
    removeImage(imageId);
    addImage({ ...img, productId: productId || undefined });
  }

  return (
    <div className="max-w-4xl mx-auto px-6 pb-16">
      <SaveIndicator show={showSaved} />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Ma Marque</h1>
        <p className="mt-1 text-sm text-muted">
          Configurez votre marque, vos produits et vos images en un seul endroit.
        </p>
      </div>

      <div className="space-y-4">
        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 1: Analyse du site                 */}
        {/* ═══════════════════════════════════════════ */}
        <Section
          title="Analyse du site"
          icon={Search}
          defaultOpen={!brandAnalysis}
        >
          {/* Existing analysis summary */}
          {brandAnalysis && !isLoading && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {brandAnalysis.brandName}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {brandAnalysis.products.length} produit
                    {brandAnalysis.products.length > 1 ? "s" : ""} &middot;{" "}
                    {brandAnalysis.offers.length} offre
                    {brandAnalysis.offers.length > 1 ? "s" : ""} &middot;{" "}
                    {brandAnalysis.url}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label
                htmlFor="brand-url"
                className="block text-xs font-medium text-foreground mb-1.5"
              >
                {brandAnalysis ? "Re-analyser un site" : "URL de votre site"}
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="brand-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://votre-site.com"
                  className="w-full pl-11 pr-4 py-3 input-tech text-sm"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {analysisError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{analysisError}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {phases[phase]}
                  </p>
                  <div className="flex justify-center gap-1.5 mt-2">
                    {phases.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i <= phase ? "bg-primary" : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                {brandAnalysis ? "Re-analyser" : "Analyser le site"}
              </button>
            )}
          </form>
        </Section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 2: Informations de la marque       */}
        {/* ═══════════════════════════════════════════ */}
        {brandAnalysis && (
          <Section title="Informations de la marque" icon={Building2}>
            <div className="space-y-4">
              <InlineEditableField
                label="Nom de la marque"
                value={brandAnalysis.brandName}
                onSave={(v) => handleBrandFieldSave("brandName", v)}
                placeholder="Nom de votre marque"
              />
              <InlineEditableField
                label="Description"
                value={brandAnalysis.brandDescription}
                onSave={(v) => handleBrandFieldSave("brandDescription", v)}
                type="textarea"
                placeholder="Décrivez votre marque"
              />
              <InlineEditableField
                label="Ton de communication"
                value={brandAnalysis.tone}
                onSave={(v) => handleBrandFieldSave("tone", v)}
                placeholder="Ex: professionnel, amical, luxe..."
              />
              <InlineEditableField
                label="Audience cible"
                value={brandAnalysis.targetAudience}
                onSave={(v) => handleBrandFieldSave("targetAudience", v)}
                placeholder="Décrivez votre audience"
              />
              <InlineEditableField
                label="Arguments de vente (séparés par des virgules)"
                value={brandAnalysis.uniqueSellingPoints.join(", ")}
                onSave={(v) => handleBrandFieldSave("uniqueSellingPoints", v)}
                type="list"
                placeholder="Qualité, prix, innovation..."
              />
              <InlineEditableField
                label="Produits concurrents (séparés par des virgules)"
                value={(brandAnalysis.competitorProducts || []).join(", ")}
                onSave={(v) => handleBrandFieldSave("competitorProducts", v)}
                type="list"
                placeholder="Concurrent A, Concurrent B..."
              />

              {/* Colors */}
              {brandAnalysis.colors.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-muted mb-2">
                    Couleurs de la marque
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {brandAnalysis.colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div
                          className="w-7 h-7 rounded-lg border border-border"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-muted font-mono">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logo */}
              <div>
                <label className="block text-xs font-medium text-muted mb-2">
                  Logo de la marque
                </label>
                {brandLogo ? (
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-gray-50 flex items-center justify-center">
                      <img
                        src={brandLogo.previewUrl}
                        alt="Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setBrandLogo(null);
                        if (currentUser) syncDeleteLogo(currentUser.id);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-surface border border-border px-4 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-gray-100 transition-colors">
                    Uploader le logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleLogoUpload(Array.from(e.target.files));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 3: Produits                        */}
        {/* ═══════════════════════════════════════════ */}
        {brandAnalysis && (
          <Section
            title="Produits"
            icon={Package}
            badge={brandAnalysis.products.length}
          >
            <div className="space-y-3">
              {brandAnalysis.products.map((product) => {
                const isExpanded = expandedProduct === product.id;
                const productImage = uploadedImages.find(
                  (img) => img.productId === product.id
                );

                return (
                  <div
                    key={product.id}
                    className="border border-border rounded-xl overflow-hidden"
                  >
                    {/* Compact card header */}
                    <div
                      onClick={() =>
                        setExpandedProduct(isExpanded ? null : product.id)
                      }
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface/50 transition-colors"
                    >
                      {productImage ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0">
                          <img
                            src={productImage.previewUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 h-10 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 flex-shrink-0 flex items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-100 transition-colors"
                          title="Ajouter une image produit"
                        >
                          <Camera className="w-4 h-4 text-amber-500" />
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={async (e) => {
                              if (!e.target.files?.length) return;
                              const formData = new FormData();
                              formData.append("images", e.target.files[0]);
                              try {
                                const res = await fetch("/api/upload", { method: "POST", body: formData });
                                if (!res.ok) return;
                                const { images } = await res.json();
                                if (images[0]) {
                                  const newImg = {
                                    id: images[0].id,
                                    previewUrl: images[0].dataUrl,
                                    base64: images[0].base64,
                                    mimeType: images[0].mimeType,
                                    name: images[0].name,
                                    productId: product.id,
                                    isAiGenerated: false,
                                  };
                                  addImage(newImg);
                                  if (currentUser) await syncImage(currentUser.id, newImg);
                                }
                              } catch (err) {
                                console.error("Quick upload error:", err);
                              }
                            }}
                          />
                        </label>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.salePrice && (
                            <span className="text-xs font-semibold text-primary">
                              {product.salePrice}
                            </span>
                          )}
                          {product.price && !product.salePrice && (
                            <span className="text-xs text-muted">
                              {product.price}
                            </span>
                          )}
                          {product.price && product.salePrice && (
                            <span className="text-xs text-muted line-through">
                              {product.price}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProduct(product.id);
                            debouncedSync();
                          }}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded edit fields */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
                        <InlineEditableField
                          label="Nom"
                          value={product.name}
                          onSave={(v) =>
                            handleProductFieldSave(product.id, "name", v)
                          }
                        />
                        <InlineEditableField
                          label="Description"
                          value={product.description}
                          onSave={(v) =>
                            handleProductFieldSave(
                              product.id,
                              "description",
                              v
                            )
                          }
                          type="textarea"
                          placeholder="Description du produit"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <InlineEditableField
                            label="Prix"
                            value={product.price || ""}
                            onSave={(v) =>
                              handleProductFieldSave(product.id, "price", v)
                            }
                            placeholder="29,90 EUR"
                          />
                          <InlineEditableField
                            label="Prix original"
                            value={product.originalPrice || ""}
                            onSave={(v) =>
                              handleProductFieldSave(
                                product.id,
                                "originalPrice",
                                v
                              )
                            }
                            placeholder="39,90 EUR"
                          />
                          <InlineEditableField
                            label="Prix promo"
                            value={product.salePrice || ""}
                            onSave={(v) =>
                              handleProductFieldSave(
                                product.id,
                                "salePrice",
                                v
                              )
                            }
                            placeholder="19,90 EUR"
                          />
                        </div>
                        <InlineEditableField
                          label="Caractéristiques (séparées par des virgules)"
                          value={product.features.join(", ")}
                          onSave={(v) =>
                            handleProductFieldSave(product.id, "features", v)
                          }
                          type="list"
                          placeholder="Naturel, Bio, Vegan..."
                        />
                        <button
                          onClick={() => {
                            removeProduct(product.id);
                            debouncedSync();
                            setExpandedProduct(null);
                          }}
                          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Supprimer ce produit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => {
                  const newId = `prod-${Date.now()}`;
                  addProduct({
                    id: newId,
                    name: "Nouveau produit",
                    description: "",
                    price: "",
                    features: [],
                  });
                  setExpandedProduct(newId);
                  debouncedSync();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un produit
              </button>
            </div>
          </Section>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 4: Offres & Promotions             */}
        {/* ═══════════════════════════════════════════ */}
        {brandAnalysis && (
          <Section
            title="Offres & Promotions"
            icon={Tag}
            badge={brandAnalysis.offers.length}
          >
            <div className="space-y-3">
              {brandAnalysis.offers.length === 0 && (
                <p className="text-sm text-muted text-center py-2">
                  Aucune offre pour le moment.
                </p>
              )}

              {brandAnalysis.offers.map((offer) => {
                const isExpanded = expandedOffer === offer.id;
                const linkedProduct = brandAnalysis.products.find(
                  (p) => p.id === offer.productId
                );

                return (
                  <div
                    key={offer.id}
                    className="border border-border rounded-xl overflow-hidden"
                  >
                    <div
                      onClick={() =>
                        setExpandedOffer(isExpanded ? null : offer.id)
                      }
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {offer.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {offer.discountValue && (
                            <span className="text-xs font-semibold text-primary">
                              -{offer.discountValue}
                            </span>
                          )}
                          {linkedProduct && (
                            <span className="text-xs text-muted">
                              {linkedProduct.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeOffer(offer.id);
                            debouncedSync();
                          }}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
                        <InlineEditableField
                          label="Titre"
                          value={offer.title}
                          onSave={(v) =>
                            handleOfferFieldSave(offer.id, "title", v)
                          }
                        />
                        <InlineEditableField
                          label="Description"
                          value={offer.description}
                          onSave={(v) =>
                            handleOfferFieldSave(offer.id, "description", v)
                          }
                          type="textarea"
                          placeholder="Description de l'offre"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <InlineEditableField
                            label="Réduction"
                            value={offer.discountValue || ""}
                            onSave={(v) =>
                              handleOfferFieldSave(
                                offer.id,
                                "discountValue",
                                v
                              )
                            }
                            placeholder="20%"
                          />
                          <InlineEditableField
                            label="Prix original"
                            value={offer.originalPrice || ""}
                            onSave={(v) =>
                              handleOfferFieldSave(
                                offer.id,
                                "originalPrice",
                                v
                              )
                            }
                            placeholder="39,90 EUR"
                          />
                          <InlineEditableField
                            label="Prix promo"
                            value={offer.salePrice || ""}
                            onSave={(v) =>
                              handleOfferFieldSave(offer.id, "salePrice", v)
                            }
                            placeholder="19,90 EUR"
                          />
                        </div>

                        {/* Product link dropdown */}
                        <div>
                          <label className="block text-xs font-medium text-muted mb-1">
                            Produit lié
                          </label>
                          <select
                            value={offer.productId || ""}
                            onChange={(e) => {
                              updateOffer(offer.id, {
                                productId: e.target.value || undefined,
                              });
                              debouncedSync();
                            }}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <option value="">Aucun produit</option>
                            {brandAnalysis.products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => {
                            removeOffer(offer.id);
                            debouncedSync();
                            setExpandedOffer(null);
                          }}
                          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Supprimer cette offre
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => {
                  const newId = `offer-${Date.now()}`;
                  addOffer({
                    id: newId,
                    title: "Nouvelle offre",
                    description: "",
                    discountType: "percentage",
                    discountValue: "",
                  });
                  setExpandedOffer(newId);
                  debouncedSync();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter une offre
              </button>
            </div>
          </Section>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 5: Images produits                 */}
        {/* ═══════════════════════════════════════════ */}
        {brandAnalysis && (
          <Section
            title="Images produits"
            icon={ImageIcon}
            badge={uploadedImages.length || undefined}
          >
            <div className="space-y-6">
              {/* Tip */}
              <div className="flex items-start gap-3 bg-primary/[0.04] border border-primary/10 rounded-xl px-4 py-3">
                <Camera className="w-4 h-4 text-primary/60 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted leading-relaxed">
                  <span className="font-semibold text-foreground">Conseil :</span> Utilisez des photos de vos produits avec leur packaging réel. Cela permet à l&apos;IA de reproduire fidèlement votre produit sans inventer un packaging fictif.
                </p>
              </div>

              {/* Upload zone */}
              <div>
                <ImageUploadZone
                  onFilesSelected={handleUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Upload en cours...
                  </div>
                )}
              </div>

              {/* Image gallery */}
              {uploadedImages.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                    Galerie ({uploadedImages.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {uploadedImages.map((img) => (
                      <div key={img.id} className="space-y-2">
                        <div className="relative group rounded-xl overflow-hidden border border-border aspect-square">
                          {/* Checkerboard bg */}
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage:
                                "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
                              backgroundSize: "16px 16px",
                              backgroundPosition:
                                "0 0, 0 8px, 8px -8px, -8px 0px",
                            }}
                          />
                          <img
                            src={img.previewUrl}
                            alt={img.name}
                            className="relative w-full h-full object-cover"
                          />
                          {/* BG removal overlay */}
                          {removingBgId === img.id && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 z-10">
                              <Loader2 className="w-6 h-6 animate-spin text-white" />
                              <span className="text-white text-[10px] font-medium">
                                Détourage...
                              </span>
                            </div>
                          )}
                          {/* Badges */}
                          {img.isAiGenerated && (
                            <div className="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Wand2 className="w-2.5 h-2.5" />
                              IA
                            </div>
                          )}
                          {img.name.includes("-detoured") && (
                            <div className="absolute top-2 left-2 bg-green-500/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              Détouré
                            </div>
                          )}
                          {/* Actions on hover */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!img.name.includes("-detoured") &&
                              !img.isAiGenerated && (
                                <button
                                  onClick={() => removeBackground(img.id)}
                                  disabled={removingBgId !== null}
                                  className="bg-black/50 hover:bg-primary text-white p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                  title="Supprimer le fond"
                                >
                                  <Scissors className="w-3.5 h-3.5" />
                                </button>
                              )}
                            <button
                              onClick={() => {
                                removeImage(img.id);
                                if (currentUser) syncDeleteImage(currentUser.id, img.id, img.name);
                              }}
                              className="bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {/* Product association */}
                        <select
                          value={img.productId || ""}
                          onChange={(e) =>
                            handleImageProductChange(img.id, e.target.value)
                          }
                          className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="">Aucun produit</option>
                          {brandAnalysis.products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI generation section */}
              <div>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                  Génération IA
                </h3>
                <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Produit
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {brandAnalysis.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Type de scène
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sceneTypes.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSceneType(s.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            sceneType === s.id
                              ? "bg-primary text-white"
                              : "bg-white border border-border text-foreground hover:bg-gray-100"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {sceneType === "custom" && (
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Décrivez la scène
                      </label>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Ex: Le produit posé sur du sable avec la mer en arrière-plan..."
                        rows={3}
                        className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={
                      generating ||
                      (sceneType === "custom" && !customPrompt) ||
                      brandAnalysis.products.length === 0
                    }
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Générer une image
                      </>
                    )}
                  </button>
                </div>
              </div>

              {imageError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {imageError}
                </div>
              )}
            </div>
          </Section>
        )}
      </div>

      {/* Sticky save button */}
      {brandAnalysis && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => {
              if (currentUser) {
                syncBrandAnalysis(currentUser.id);
                setShowSaved(true);
                if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                saveTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
              }
            }}
            className="btn-gradient flex items-center gap-2 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-glow-lg"
          >
            <Save className="w-4 h-4" />
            Sauvegarder les modifications
          </button>
        </div>
      )}
    </div>
  );
}
