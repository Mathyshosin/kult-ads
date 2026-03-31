"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { updateGeneratedAdFavorite, updateGeneratedAdImage } from "@/lib/supabase/sync";
import type { GeneratedAd } from "@/lib/types";
import {
  Download,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Heart,
  Pencil,
  Send,
  Bug,
  ChevronDown,
  Images,
  Filter,
  Smartphone,
  Gift,
} from "lucide-react";
import { toPng } from "html-to-image";
import { FunFact } from "@/components/fun-facts";

// Helper: use public URL when available, fallback to base64
function adImageSrc(ad: GeneratedAd): string {
  if (ad.imageUrl) return ad.imageUrl;
  if (ad.imageBase64) return `data:${ad.mimeType};base64,${ad.imageBase64}`;
  return "";
}

// ── Loading state with fun facts ──
function AdsLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-8 animate-fade-in">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Récupération de vos ads...
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Chargement de votre bibliothèque
        </p>
      </div>
      <FunFact />
    </div>
  );
}

// ── Cooking-style generating card ──
function GeneratingCard({ ad }: { ad: GeneratedAd }) {
  const tips = [
    "Préparation des ingrédients...",
    "Ajout d'une pincée de créativité...",
    "Cuisson en cours...",
    "Touche finale...",
    "Presque prêt...",
  ];
  const tip = useMemo(() => tips[Math.floor(Math.random() * tips.length)], []);

  return (
    <div
      className={`relative ${
        ad.format === "story" ? "aspect-[9/16]" : "aspect-square"
      } rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50 border border-blue-100/50`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        {/* Animated pan icon */}
        <div className="relative">
          <div className="text-4xl animate-bounce-soft">🍳</div>
          <div className="absolute -top-2 -right-2 text-lg animate-pulse">✨</div>
        </div>
        <div className="text-center px-6">
          <p className="text-sm font-semibold text-gray-900">On prépare votre ad</p>
          <p className="text-xs text-gray-400 mt-1.5 italic">{tip}</p>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-400"
              style={{
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          40% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

// ── Failed card ──
function FailedCard({ ad, onRetry, onDelete }: { ad: GeneratedAd; onRetry?: () => void; onDelete: () => void }) {
  return (
    <div
      className={`relative ${
        ad.format === "story" ? "aspect-[9/16]" : "aspect-square"
      } rounded-2xl overflow-hidden bg-white border border-red-100`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 text-center">Échec</p>
        {ad.error && <p className="text-xs text-gray-400 text-center line-clamp-2">{ad.error}</p>}
        <div className="flex gap-4 mt-1">
          {onRetry && (
            <button onClick={onRetry} className="text-xs font-semibold text-blue-500 hover:text-blue-600">
              Réessayer
            </button>
          )}
          <button onClick={onDelete} className="text-xs font-semibold text-red-400 hover:text-red-500">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Completed card with actions below ──
function CompletedCard({ ad, onClick, onToggleFavorite, onModify, onDownload, onDelete, onOpenModify }: {
  ad: GeneratedAd;
  onClick: () => void;
  onToggleFavorite: () => void;
  onModify: (ad: GeneratedAd, prompt: string, formatOverride?: "square" | "story") => void;
  onDelete: (id: string) => void;
  onDownload: (ad: GeneratedAd) => void;
  onOpenModify: () => void;
}) {
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  const isSquare = ad.format === "square";

  return (
    <div className="space-y-2 break-inside-avoid">
      {/* Image */}
      <div
        onClick={onClick}
        className={`group relative ${
          ad.format === "story" ? "aspect-[9/16]" : "aspect-square"
        } rounded-2xl overflow-hidden bg-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 active:scale-[0.98]`}
      >
        <img
          src={adImageSrc(ad)}
          alt="Ad"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Gift badge */}
        {ad.isGift && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold shadow-md">
            <Gift className="w-3 h-3" />
            Cadeau
          </div>
        )}
        {/* Hover overlay with download */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(ad); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-semibold shadow-sm hover:bg-white active:scale-95"
          >
            <Download className="w-3 h-3" />
            Télécharger
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(ad.id); }}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/90 backdrop-blur-sm text-white shadow-sm hover:bg-red-600 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Favorite */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-xl flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all active:scale-90"
        >
          <Heart className={`w-4 h-4 transition-colors ${ad.isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>
      </div>

      {/* Action buttons below card */}
      <div className="flex gap-1.5">
        {isSquare && (
          <button
            onClick={() => onModify(ad, "Étends cette image au format vertical 9:16 (story) en ajoutant du fond décoratif au-dessus et en-dessous. Garde TOUT le contenu existant identique (texte, produit, logo, mise en page). Agrandis légèrement les éléments si nécessaire pour remplir l'espace.", "story")}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 text-[11px] font-medium hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50 transition-all"
          >
            <Smartphone className="w-3 h-3" />
            Story
          </button>
        )}
        <button
          onClick={onOpenModify}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 text-[11px] font-medium hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
        >
          <Pencil className="w-3 h-3" />
          Modifier
        </button>
      </div>
    </div>
  );
}

// ── Ad detail modal ──
function AdDetailModal({ ad, onClose, onDelete, onModify, onToggleFavorite, isAdmin, initialShowModify }: {
  ad: GeneratedAd;
  onClose: () => void;
  onDelete: (id: string) => void;
  onModify: (ad: GeneratedAd, prompt: string, formatOverride?: "square" | "story") => void;
  onToggleFavorite: (id: string) => void;
  isAdmin?: boolean;
  initialShowModify?: boolean;
}) {
  const isStory = ad.format === "story";
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showModify, setShowModify] = useState(initialShowModify || false);
  const [modifyPrompt, setModifyPrompt] = useState("");

  async function handleDownload() {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 50));
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `kultads-${ad.format}-${Date.now()}.png`;
      link.click();
    } catch {
      const link = document.createElement("a");
      link.href = ad.imageUrl || `data:${ad.mimeType};base64,${ad.imageBase64}`;
      link.download = `kultads-${ad.format}-${ad.id}.png`;
      link.click();
    }
    setIsExporting(false);
  }

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite(ad.id);
  }, [ad.id, onToggleFavorite]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div
        className={`relative w-full animate-scale-in px-4 sm:px-0 ${isStory ? "max-w-[320px]" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-50 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="rounded-3xl max-h-[92vh] overflow-y-auto">
          {/* Ad image */}
          <div
            ref={cardRef}
            className={`relative ${isStory ? "aspect-[9/16]" : "aspect-square"} rounded-3xl overflow-hidden bg-gray-100`}
          >
            <img
              src={adImageSrc(ad)}
              alt="Ad"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {!isExporting && (
              <div className="absolute top-4 right-4 z-30">
                <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                  {isStory ? "Story" : "Carré"}
                </span>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Export..." : "Télécharger"}
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                ad.isFavorite
                  ? "bg-red-50 text-red-500 ring-1 ring-red-100"
                  : "bg-white ring-1 ring-gray-200 text-gray-400 hover:text-gray-600"
              }`}
            >
              <Heart className={`w-4.5 h-4.5 ${ad.isFavorite ? "fill-red-500" : ""}`} />
            </button>
            <button
              onClick={() => setShowModify(!showModify)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                showModify
                  ? "bg-blue-500 text-white ring-1 ring-blue-500"
                  : "bg-white ring-1 ring-gray-200 text-gray-400 hover:text-gray-600"
              }`}
              title="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {/* Convert to Story — only for square ads */}
            {!isStory && (
              <button
                onClick={() => {
                  onModify(ad, "Étends cette image au format vertical 9:16 (story) en ajoutant du fond décoratif au-dessus et en-dessous. Garde TOUT le contenu existant identique (texte, produit, logo, mise en page). Agrandis légèrement les éléments si nécessaire pour remplir l'espace.", "story");
                  onClose();
                }}
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-white ring-1 ring-gray-200 text-gray-400 hover:text-violet-500 hover:ring-violet-200 hover:bg-violet-50 transition-all active:scale-90"
                title="Adapter en Story"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}
            {ad._debug?.templateImageBase64 && (
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 overflow-hidden ${
                  showDebug
                    ? "ring-2 ring-blue-500"
                    : "ring-1 ring-gray-200 hover:ring-gray-300"
                }`}
              >
                <img
                  src={`data:${ad._debug.templateMimeType || "image/png"};base64,${ad._debug.templateImageBase64}`}
                  alt="Ref"
                  className="w-full h-full object-cover"
                />
              </button>
            )}
            <button
              onClick={() => { onDelete(ad.id); onClose(); }}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white ring-1 ring-gray-200 text-red-400 hover:bg-red-50 hover:ring-red-100 transition-all active:scale-90"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Modify input */}
          {showModify && (
            <div className="mt-4 animate-fade-in">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={modifyPrompt}
                  onChange={(e) => setModifyPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && modifyPrompt.trim()) {
                      onModify(ad, modifyPrompt.trim());
                      setModifyPrompt("");
                      setShowModify(false);
                      onClose();
                    }
                  }}
                  placeholder="Ex: change le fond en bleu, agrandis le logo..."
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (modifyPrompt.trim()) {
                      onModify(ad, modifyPrompt.trim());
                      setModifyPrompt("");
                      setShowModify(false);
                      onClose();
                    }
                  }}
                  disabled={!modifyPrompt.trim()}
                  className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-30 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 px-1">Appuyez sur Entrée pour envoyer la modification</p>
            </div>
          )}

          {/* Reference image / Debug panel */}
          {showDebug && ad._debug && (
            <div className="mt-4 animate-fade-in">
              {/* Template/reference image for everyone */}
              {ad._debug.templateImageBase64 && (
                <div className="bg-white rounded-2xl p-3 ring-1 ring-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Ad de référence</p>
                  <img
                    src={`data:${ad._debug.templateMimeType || "image/png"};base64,${ad._debug.templateImageBase64}`}
                    alt="Template"
                    className="rounded-xl w-full h-auto"
                  />
                </div>
              )}

              {/* Admin-only debug details */}
              {isAdmin && (
                <div className="mt-3 bg-gray-900 text-gray-100 rounded-2xl p-4 text-xs space-y-3 max-h-[40vh] overflow-y-auto">
                  <h4 className="font-bold text-amber-400 text-sm">Debug</h4>
                  {ad._debug.templateType && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Type:</span>
                      <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">{ad._debug.templateType}</span>
                    </div>
                  )}
                  <div>
                    <button
                      onClick={() => { const el = document.getElementById("debug-prompt"); if (el) el.classList.toggle("hidden"); }}
                      className="flex items-center gap-1 text-gray-400 font-medium hover:text-gray-200 mb-1"
                    >
                      Prompt Gemini <ChevronDown className="w-3 h-3" />
                    </button>
                    <pre id="debug-prompt" className="whitespace-pre-wrap text-gray-300 bg-gray-800 rounded-xl p-3 leading-relaxed text-[11px] hidden">
                      {ad._debug.geminiPrompt}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function AdsGalleryPage() {
  const generatedAds = useWizardStore((s) => s.generatedAds);
  const updateGeneratedAd = useWizardStore((s) => s.updateGeneratedAd);
  const removeGeneratedAd = useWizardStore((s) => s.removeGeneratedAd);
  const syncDeleteGeneratedAd = useWizardStore((s) => s.syncDeleteGeneratedAd);
  const isHydrated = useWizardStore((s) => s.isHydrated);
  const adsLoaded = useWizardStore((s) => s.adsLoaded);
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = currentUser?.email === "mathys.hosin@gmail.com";

  const [filter, setFilter] = useState<"all" | "square" | "story" | "favorites">("all");
  const [selectedAd, setSelectedAd] = useState<GeneratedAd | null>(null);
  const [openModify, setOpenModify] = useState(false);

  // Quick download helper
  const handleQuickDownload = (ad: GeneratedAd) => {
    const src = adImageSrc(ad);
    if (!src) return;
    const link = document.createElement("a");
    link.href = src;
    link.download = `kultads-${ad.format}-${ad.id}.png`;
    link.click();
  };

  // Sort: generating first, then by timestamp desc
  const sorted = [...generatedAds].sort((a, b) => {
    if (a.status === "generating" && b.status !== "generating") return -1;
    if (a.status !== "generating" && b.status === "generating") return 1;
    return b.timestamp - a.timestamp;
  });

  const filtered = (() => {
    if (filter === "favorites") return sorted.filter((ad) => ad.isFavorite);
    if (filter === "all") return sorted;
    return sorted.filter((ad) => ad.format === filter);
  })();

  const completedCount = generatedAds.filter((a) => a.status !== "generating" && a.status !== "failed").length;
  const generatingCount = generatedAds.filter((a) => a.status === "generating").length;
  const favoritesCount = generatedAds.filter((a) => a.isFavorite).length;

  const handleDelete = (id: string) => {
    removeGeneratedAd(id);
    if (currentUser) syncDeleteGeneratedAd(currentUser.id, id);
  };

  const handleToggleFavorite = (id: string) => {
    const ad = generatedAds.find((a) => a.id === id);
    if (ad) {
      const newFav = !ad.isFavorite;
      updateGeneratedAd(id, { isFavorite: newFav });
      if (currentUser) {
        updateGeneratedAdFavorite(currentUser.id, id, newFav).catch(console.error);
      }
    }
  };

  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const uploadedImages = useWizardStore((s) => s.uploadedImages);
  const brandLogo = useWizardStore((s) => s.brandLogo);
  const startGeneration = useWizardStore((s) => s.startGeneration);
  const completeGeneration = useWizardStore((s) => s.completeGeneration);
  const failGeneration = useWizardStore((s) => s.failGeneration);
  const syncGeneratedAd = useWizardStore((s) => s.syncGeneratedAd);
  const brandAnalysisId = useWizardStore((s) => s.brandAnalysisId);

  const handleModify = async (ad: GeneratedAd, prompt: string, formatOverride?: "square" | "story") => {
    if (!brandAnalysis) return;

    const product = brandAnalysis.products.find((p) => p.id === ad.productId) || brandAnalysis.products[0];
    if (!product) return;

    const productImage = uploadedImages.find((img) => img.productId === product.id);
    const targetFormat = formatOverride || ad.format;

    // Always create a NEW ad — keep the original intact
    const targetId = startGeneration({ format: targetFormat, productId: ad.productId });
    setSelectedAd(null);

    try {
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandAnalysis,
          product,
          format: targetFormat,
          modificationPrompt: prompt,
          previousAdId: ad.id,
          productImageBase64: productImage?.base64,
          productImageMimeType: productImage?.mimeType,
          brandLogoBase64: brandLogo?.base64,
          brandLogoMimeType: brandLogo?.mimeType,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errMsg = `Erreur ${res.status}`;
        try {
          const err = JSON.parse(text);
          errMsg = err.error || errMsg;
        } catch {
          errMsg = text.slice(0, 200) || errMsg;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();

      // Complete the new ad placeholder (original is untouched)
      completeGeneration(targetId, { ...data, format: targetFormat });
      if (currentUser && brandAnalysisId) {
        syncGeneratedAd(currentUser.id, { ...data, id: targetId, format: targetFormat });
      }
      // Update credits counter in header
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err) {
      failGeneration(targetId, err instanceof Error ? err.message : "Échec de la modification");
    }
  };

  // Only show loading if no ads in memory yet and still loading
  if (!isHydrated || (!adsLoaded && generatedAds.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-5">
        <AdsLoadingState />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center">
            <Images className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Mes Publicités
              {completedCount > 0 && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {completedCount}
                </span>
              )}
            </h1>
            {generatingCount > 0 && (
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                {generatingCount} en cours...
              </p>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 bg-gray-100/80 rounded-xl p-1 overflow-x-auto flex-nowrap">
          <Filter className="w-3.5 h-3.5 text-gray-400 ml-2 mr-1" />
          {(["all", "square", "story", "favorites"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "favorites" && <Heart className={`w-3 h-3 ${filter === "favorites" ? "fill-red-500 text-red-500" : ""}`} />}
              {f === "all" ? "Tous" : f === "square" ? "Carré" : f === "story" ? "Story" : "Favoris"}
              {f === "favorites" && favoritesCount > 0 && (
                <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-bold ml-0.5">{favoritesCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            {filter === "favorites" ? (
              <Heart className="w-7 h-7 text-gray-300" />
            ) : (
              <Images className="w-7 h-7 text-gray-300" />
            )}
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900">
              {filter === "favorites" ? "Aucun favori" : "Aucune publicité"}
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              {filter === "favorites"
                ? "Cliquez sur le cœur d'une publicité pour l'ajouter ici"
                : "Rendez-vous dans le Générateur pour créer votre première pub !"}
            </p>
          </div>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map((ad) => {
            const status = ad.status || "completed";
            if (status === "generating") {
              return <GeneratingCard key={ad.id} ad={ad} />;
            }
            if (status === "failed") {
              return (
                <FailedCard
                  key={ad.id}
                  ad={ad}
                  onDelete={() => handleDelete(ad.id)}
                />
              );
            }
            return (
              <CompletedCard
                key={ad.id}
                ad={ad}
                onClick={() => { setOpenModify(false); setSelectedAd(ad); }}
                onToggleFavorite={() => handleToggleFavorite(ad.id)}
                onModify={handleModify}
                onDownload={handleQuickDownload}
                onDelete={handleDelete}
                onOpenModify={() => { setOpenModify(true); setSelectedAd(ad); }}
              />
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedAd && (
        <AdDetailModal
          ad={selectedAd}
          onClose={() => { setSelectedAd(null); setOpenModify(false); }}
          onDelete={handleDelete}
          onModify={handleModify}
          onToggleFavorite={handleToggleFavorite}
          isAdmin={isAdmin}
          initialShowModify={openModify}
        />
      )}
    </div>
  );
}
