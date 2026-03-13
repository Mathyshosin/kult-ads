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
  Zap,
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

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setFailedCount(0);
    setConcepts([]);

    const product = brandAnalysis!.products.find((p) => p.id === selectedProduct);
    const offer = brandAnalysis!.offers.find((o) => o.id === selectedOffer);
    const image = uploadedImages.find((i) => i.id === selectedImage);

    // ── PHASE 1: Generate smart concepts with Claude ──
    setPhase("concepts");

    let adConcepts: AdConcept[] = [];
    try {
      const conceptRes = await fetch("/api/ad-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandAnalysis,
          product,
          offer: offer || null,
          count: variations,
          customDirection: customDirection.trim() || undefined,
        }),
      });

      if (!conceptRes.ok) {
        throw new Error("Erreur lors de la génération des concepts");
      }

      const conceptData = await conceptRes.json();
      adConcepts = conceptData.concepts || [];
      setConcepts(adConcepts);
    } catch (err) {
      console.error("Concept generation failed:", err);
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

    // ── PHASE 2: Generate ads (always square) ──
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
            offer: offer || null,
            productImageBase64: image?.base64,
            productImageMimeType: image?.mimeType,
            format: "square",
            concept,
          }),
        });

        if (!res.ok) {
          failed++;
          setFailedCount(failed);
          current++;
          setProgress({ current, total: totalAds });
          continue;
        }

        const ad = await res.json();
        addGeneratedAd(ad);
        current++;
        setProgress({ current, total: totalAds });
      } catch {
        failed++;
        setFailedCount(failed);
        current++;
        setProgress({ current, total: totalAds });
      }
    }

    if (failed > 0 && failed < totalAds) {
      setError(`${totalAds - failed}/${totalAds} ads générées (${failed} ont échoué)`);
    } else if (failed === totalAds) {
      setError("Toutes les générations ont échoué. Réessaie dans quelques secondes.");
    }

    setGenerating(false);
    setPhase("idle");
  }

  async function handleConvertToStory(ad: typeof generatedAds[0]) {
    setConvertingId(ad.id);
    const product = brandAnalysis!.products.find((p) => p.id === ad.productId);
    const offer = brandAnalysis!.offers.find((o) => o.id === ad.offerId);
    const image = uploadedImages.find((i) => i.id === selectedImage);
    const matchingConcept = concepts.find((c) => c.adType === ad.conversionAngle);

    try {
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandAnalysis,
          product,
          offer: offer || null,
          productImageBase64: image?.base64,
          productImageMimeType: image?.mimeType,
          format: "story",
          concept: matchingConcept,
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
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Générez vos publicités
        </h1>
        <p className="mt-2 text-muted">
          L&apos;IA analyse votre produit et crée des ads stratégiques et adaptées.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Config panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
            <h2 className="text-sm font-semibold text-foreground">
              Configuration
            </h2>

            {/* Product */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Produit
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {brandAnalysis.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Offer */}
            {brandAnalysis.offers.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Offre (optionnel)
                </label>
                <select
                  value={selectedOffer}
                  onChange={(e) => setSelectedOffer(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Sans offre</option>
                  {brandAnalysis.offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Image */}
            {uploadedImages.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Image produit
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {uploadedImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.id)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
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
              </div>
            )}

            {/* Custom direction */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Direction créative (optionnel)
              </label>
              <textarea
                value={customDirection}
                onChange={(e) => setCustomDirection(e.target.value)}
                placeholder="Ex: Je veux une ad comparaison culotte VS serviette, une ad avec des femmes qui portent le produit, une ad offre spéciale..."
                rows={3}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-muted/60"
              />
              <p className="text-[10px] text-muted mt-1">
                Décrivez les types d&apos;ads que vous voulez. L&apos;IA s&apos;en inspirera pour créer les concepts.
              </p>
            </div>

            {/* Variations */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Nombre de concepts
              </label>
              <select
                value={variations}
                onChange={(e) => setVariations(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} concepts
                  </option>
                ))}
              </select>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedProduct}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                phase === "concepts" ? (
                  <>
                    <Brain className="w-4 h-4 animate-pulse" />
                    Analyse du produit...
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {progress.current}/{progress.total} en cours...
                    {failedCount > 0 && ` (${failedCount} fail)`}
                  </>
                )
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer les publicités
                </>
              )}
            </button>

            {generatedAds.length > 0 && (
              <button
                onClick={clearAds}
                className="w-full text-xs text-muted hover:text-foreground transition-colors py-2"
              >
                Effacer toutes les publicités
              </button>
            )}
          </div>

          {/* Concepts display */}
          {concepts.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Concepts générés
              </h3>
              <div className="space-y-2">
                {concepts.map((c, i) => (
                  <div
                    key={c.id}
                    className="text-[11px] p-2.5 rounded-lg bg-surface border border-border"
                  >
                    <span className="font-semibold text-primary">
                      {i + 1}. {c.adType}
                    </span>
                    <p className="text-muted mt-0.5 leading-snug">
                      {c.copyAngle}
                    </p>
                  </div>
                ))}
              </div>
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

        {/* Right: Gallery */}
        <div className="lg:col-span-2">
          {error && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          )}

          {generatedAds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    const product = brandAnalysis.products.find(
                      (p) => p.id === ad.productId
                    );
                    const offer = brandAnalysis.offers.find(
                      (o) => o.id === ad.offerId
                    );
                    const image = uploadedImages.find(
                      (i) => i.id === selectedImage
                    );

                    try {
                      const res = await fetch("/api/generate-ad", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          brandAnalysis,
                          product,
                          offer: offer || null,
                          productImageBase64: image?.base64,
                          productImageMimeType: image?.mimeType,
                          format: ad.format,
                          concept: concepts.find((c) => c.adType === ad.conversionAngle),
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
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sparkles className="w-12 h-12 text-border mb-4" />
              <h3 className="text-lg font-medium text-foreground">
                Prêt à générer
              </h3>
              <p className="text-sm text-muted mt-1 max-w-sm">
                L&apos;IA va analyser votre produit, créer des concepts
                stratégiques adaptés, puis générer chaque publicité.
              </p>
              <div className="flex items-center gap-6 mt-6 text-[11px] text-muted">
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  Analyse produit
                </div>
                <div className="text-border">→</div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  Concepts ads
                </div>
                <div className="text-border">→</div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Génération
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
