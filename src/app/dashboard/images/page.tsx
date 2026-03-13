"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";
import ImageUploadZone from "@/components/image-upload-zone";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Loader2,
  Wand2,
  ImageIcon,
} from "lucide-react";

const sceneTypes = [
  { id: "hands", label: "Tenu en main", prompt: "A person's hands elegantly holding the product, soft natural lighting, lifestyle photography" },
  { id: "table", label: "Sur une table", prompt: "Product placed on a modern minimalist table, soft shadows, professional product photography" },
  { id: "lifestyle", label: "Lifestyle", prompt: "Product in a lifestyle scene, person using the product naturally, warm atmosphere" },
  { id: "white", label: "Fond blanc", prompt: "Product on a clean white background, professional studio lighting, e-commerce style" },
  { id: "custom", label: "Personnalisé", prompt: "" },
];

export default function ImagesPage() {
  const router = useRouter();
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const uploadedImages = useWizardStore((s) => s.uploadedImages);
  const addImage = useWizardStore((s) => s.addImage);
  const removeImage = useWizardStore((s) => s.removeImage);
  const setStep = useWizardStore((s) => s.setStep);

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [sceneType, setSceneType] = useState("hands");
  const [customPrompt, setCustomPrompt] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!brandAnalysis) {
      router.push("/dashboard/analyze");
    } else if (brandAnalysis.products.length > 0 && !selectedProduct) {
      setSelectedProduct(brandAnalysis.products[0].id);
    }
  }, [brandAnalysis, router, selectedProduct]);

  if (!brandAnalysis) return null;

  async function handleUpload(files: File[]) {
    setUploading(true);
    setError("");
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
        addImage({
          id: img.id,
          previewUrl: img.dataUrl,
          base64: img.base64,
          mimeType: img.mimeType,
          name: img.name,
          isAiGenerated: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const scene = sceneTypes.find((s) => s.id === sceneType);
      const product = brandAnalysis!.products.find(
        (p) => p.id === selectedProduct
      );

      const basePrompt = sceneType === "custom" ? customPrompt : scene?.prompt;
      const prompt = `${basePrompt}. Product: ${product?.name || "the product"} by ${brandAnalysis!.brandName}. High quality, professional advertising photography.`;

      // Find a reference image for this product
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
      addImage({
        id: `ai-${Date.now()}`,
        previewUrl: `data:${result.mimeType};base64,${result.imageBase64}`,
        base64: result.imageBase64,
        mimeType: result.mimeType,
        name: `${product?.name || "product"}-${sceneType}.png`,
        productId: selectedProduct,
        isAiGenerated: true,
        prompt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur génération");
    } finally {
      setGenerating(false);
    }
  }

  function handleContinue() {
    setStep(4);
    router.push("/dashboard/generate");
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Images produits
        </h1>
        <p className="mt-2 text-muted">
          Uploadez vos images et générez des variantes IA pour vos publicités.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upload */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Vos images
          </h2>
          <ImageUploadZone onFilesSelected={handleUpload} disabled={uploading} />
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Upload en cours...
            </div>
          )}
        </div>

        {/* Right: AI Generation */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Génération IA
          </h2>
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
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

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Type de scène
              </label>
              <div className="grid grid-cols-2 gap-2">
                {sceneTypes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSceneType(s.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      sceneType === s.id
                        ? "bg-primary text-white"
                        : "bg-surface border border-border text-foreground hover:bg-gray-100"
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
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || (sceneType === "custom" && !customPrompt)}
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
      </div>

      {/* Image gallery */}
      {uploadedImages.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Toutes vos images ({uploadedImages.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadedImages.map((img) => (
              <div
                key={img.id}
                className="relative group rounded-xl overflow-hidden border border-border aspect-square"
              >
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                {img.isAiGenerated && (
                  <div className="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Wand2 className="w-2.5 h-2.5" />
                    IA
                  </div>
                )}
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => router.push("/dashboard/review")}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <button
          onClick={handleContinue}
          disabled={uploadedImages.length === 0}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Générer les publicités
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {uploadedImages.length === 0 && (
        <div className="text-center py-8">
          <ImageIcon className="w-12 h-12 text-border mx-auto mb-3" />
          <p className="text-sm text-muted">
            Uploadez au moins une image pour continuer
          </p>
        </div>
      )}
    </div>
  );
}
