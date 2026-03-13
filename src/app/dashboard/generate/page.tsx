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
  Brain,
} from "lucide-react";

interface AdConcept {
  id: string;
  adType: string;
  scenePrompt: string;
  copyAngle: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const uploadedImages = useWizardStore((s) => s.uploadedImages);
  const generatedAds = useWizardStore((s) => s.generatedAds);
  const addGeneratedAd = useWizardStore((s) => s.addGeneratedAd);
  const updateGeneratedAd = useWizardStore((s) => s.updateGeneratedAd);
  const clearAds = useWizardStore((s) => s.clearAds);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedOffer, setSelectedOffer] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [variations, setVariations] = useState(2);
  const [customDirection, setCustomDirection] = useState("");
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState<"idle" | "concepts" | "generating">("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [failedCount, setFailedCount] = useState(0);
  const [error, setError] = useState("");
  const [concepts, setConcepts] = useState<AdConcept[]>([]);
  const [convertingId, setConvertingId] = useState<string | null>(null);

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

  // Get existing ad types to avoid duplicates
  const existingAdTypes = generatedAds
    .filter((a) => a.conversionAngle)
    .map((a) => a.conversionAngle!);

  // Helper to get current product/offer/image
  function getSelections() {
    return {
      product: brandAnalysis!.products.find((p) => p.id === selectedProduct) || brandAnalysis!.products[0],
      offer: brandAnalysis!.offers.find((o) => o.id === selectedOffer) || null,
      image: uploadedImages.find((i) => i.id === selectedImage) || uploadedImages[0],
    };
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setFailedCount(0);

    const { product, offer, image } = getSelections();

    // ── PHASE 1: Generate concepts ──
    setPhase("concepts");

    let adConcepts: AdConcept[] = [];
    try {
      const conceptRes = await fetch("/api/ad-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandAnalysis,
          product,
          offer,
          count: variations,
          customDirection: customDirection.trim() || undefined,
          existingAdTypes: existingAdTypes.length > 0 ? existingAdTypes : undefined,
        }),
      });

      if (!conceptRes.ok) throw new Error("Erreur concepts");

      const conceptData = await conceptRes.json();
      adConcepts = conceptData.concepts || [];
      setConcepts((prev) => [...prev, ...adConcepts]);
    } catch {
      setError("Erreur lors de la génération des concepts. Réessaie.");
      setGenerating(false);
      setPhase("idle");
      return;
    }

    if (adConcepts.length === 0) {
      setError("Aucun concept généré. Réessaie.");
      setGenerating(false);
      setPhase("idle");
      return;
    }

    // ── PHASE 2: Generate ads ──
    setPhase("generating");
    const totalAds = adConcepts.length;
    setProgress({ current: 0, total: totalAds });

    let current = 0;
    let failed = 0;

    for (const concept of adConcepts) {
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
            concept,
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
      setProgress({ current, total: totalAds });
    }

    if (failed > 0 && failed < totalAds) {
      setError(`${totalAds - failed}/${totalAds} ads générées`);
    } else if (failed === totalAds) {
      setError("Toutes les générations ont échoué. Réessaie.");
    }

    setGenerating(false);
    setPhase("idle");
  }

  async function handleConvertToStory(ad: typeof generatedAds[0]) {
    setConvertingId(ad.id);
    const { product, offer, image } = getSelections();
    const matchingConcept = concepts.find((c) => c.adType === ad.conversionAngle);

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
          concept: matchingConcept || undefined,
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Générez vos publicités
        </h1>
      </div>

      {/* Config bar — horizontal and compact */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Variations */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Concepts
            </label>
            <select
              value={variations}
              onChange={(e) => setVariations(Number(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} concepts</option>
              ))}
            </select>
          </div>
        </div>

        {/* Direction + Generate */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-foreground mb-1">
              Direction créative
            </label>
            <input
              type="text"
              value={customDirection}
              onChange={(e) => setCustomDirection(e.target.value)}
              placeholder="Ex: comparaison VS serviette, femmes qui portent le produit, offre spéciale..."
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted/50"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedProduct}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {generating ? (
              phase === "concepts" ? (
                <>
                  <Brain className="w-4 h-4 animate-pulse" />
                  Analyse...
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progress.current}/{progress.total}
                </>
              )
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Générer
              </>
            )}
          </button>
        </div>
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
              onClick={() => { clearAds(); setConcepts([]); }}
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
                  const matchingConcept = concepts.find((c) => c.adType === ad.conversionAngle);

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
                        concept: matchingConcept || undefined,
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
            Configurez vos paramètres et cliquez sur Générer.
            L&apos;IA crée des concepts adaptés à votre produit.
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
