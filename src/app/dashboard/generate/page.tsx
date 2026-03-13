"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore, useTemplateStore } from "@/lib/store";
import AdPreviewCard from "@/components/ad-preview-card";
import TemplateCard from "@/components/template-card";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertCircle,
  LayoutGrid,
} from "lucide-react";

export default function GeneratePage() {
  const router = useRouter();
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const uploadedImages = useWizardStore((s) => s.uploadedImages);
  const generatedAds = useWizardStore((s) => s.generatedAds);
  const addGeneratedAd = useWizardStore((s) => s.addGeneratedAd);
  const clearAds = useWizardStore((s) => s.clearAds);

  const templates = useTemplateStore((s) => s.templates);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedOffer, setSelectedOffer] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [formats, setFormats] = useState({ square: true, story: true });
  const [variations, setVariations] = useState(2);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");

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

    const product = brandAnalysis!.products.find((p) => p.id === selectedProduct);
    const offer = brandAnalysis!.offers.find((o) => o.id === selectedOffer);
    const image = uploadedImages.find((i) => i.id === selectedImage);
    const template = templates.find((t) => t.id === selectedTemplate);

    const selectedFormats = [
      ...(formats.square ? (["square"] as const) : []),
      ...(formats.story ? (["story"] as const) : []),
    ];

    const totalAds = selectedFormats.length * variations;
    setProgress({ current: 0, total: totalAds });

    let current = 0;

    for (const format of selectedFormats) {
      for (let i = 0; i < variations; i++) {
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
              format,
              templateImageBase64: template?.imageBase64,
              templateImageMimeType: template?.mimeType,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error);
          }

          const ad = await res.json();
          addGeneratedAd(ad);
          current++;
          setProgress({ current, total: totalAds });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Erreur lors de la génération"
          );
        }
      }
    }

    setGenerating(false);
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Générez vos publicités
        </h1>
        <p className="mt-2 text-muted">
          Configurez vos paramètres et laissez l&apos;IA créer vos ads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Config panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
            <h2 className="text-sm font-semibold text-foreground">
              Configuration
            </h2>

            {/* Formats */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-2">
                Formats
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formats.square}
                    onChange={(e) =>
                      setFormats({ ...formats, square: e.target.checked })
                    }
                    className="rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-foreground">
                    Carré (1080×1080)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formats.story}
                    onChange={(e) =>
                      setFormats({ ...formats, story: e.target.checked })
                    }
                    className="rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-foreground">
                    Story (1080×1920)
                  </span>
                </label>
              </div>
            </div>

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

            {/* Template selector */}
            {templates.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-2">
                  Template de référence
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  <button
                    onClick={() => setSelectedTemplate("")}
                    className={`aspect-square rounded-lg border-2 transition-colors flex flex-col items-center justify-center text-center p-2 ${
                      !selectedTemplate
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-muted mb-1" />
                    <span className="text-[10px] text-muted font-medium">
                      Sans template
                    </span>
                  </button>
                  {templates
                    .filter((t) =>
                      formats.square && !formats.story
                        ? t.format === "square"
                        : !formats.square && formats.story
                          ? t.format === "story"
                          : true
                    )
                    .map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors relative ${
                          selectedTemplate === tpl.id
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <img
                          src={tpl.previewUrl}
                          alt={tpl.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-1">
                          <p className="text-[9px] text-white truncate font-medium">
                            {tpl.name}
                          </p>
                        </div>
                        <div className="absolute top-1 right-1">
                          <span className="bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded-full">
                            {tpl.format === "story" ? "S" : "C"}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
                {selectedTemplate && (
                  <p className="text-[10px] text-primary mt-1.5 font-medium">
                    ✓ L&apos;IA reproduira le style de ce template
                  </p>
                )}
              </div>
            )}

            {/* Variations */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Variations par format
              </label>
              <select
                value={variations}
                onChange={(e) => setVariations(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} variation{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={
                generating ||
                (!formats.square && !formats.story) ||
                !selectedProduct
              }
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progress.current}/{progress.total} générées...
                </>
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
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {generatedAds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {generatedAds.map((ad) => (
                <AdPreviewCard
                  key={ad.id}
                  ad={ad}
                  onRegenerate={async () => {
                    // Single ad regeneration
                    const product = brandAnalysis.products.find(
                      (p) => p.id === ad.productId
                    );
                    const offer = brandAnalysis.offers.find(
                      (o) => o.id === ad.offerId
                    );
                    const image = uploadedImages.find(
                      (i) => i.id === selectedImage
                    );
                    const tpl = templates.find((t) => t.id === selectedTemplate);

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
                          templateImageBase64: tpl?.imageBase64,
                          templateImageMimeType: tpl?.mimeType,
                        }),
                      });

                      if (res.ok) {
                        const newAd = await res.json();
                        addGeneratedAd(newAd);
                      }
                    } catch {
                      // Silent fail for regeneration
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
                Configurez vos paramètres à gauche et cliquez sur
                &ldquo;Générer&rdquo; pour créer vos publicités.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
